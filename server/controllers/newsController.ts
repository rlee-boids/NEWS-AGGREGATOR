import { Request, Response } from 'express';
import { NewsProviderFactory } from '../factories/NewsProviderFactory';
import { getAllNews, getNewsByIdFromDB, addNewsToDB, checkArticleExists } from '../models/newsModel';
import { getDistinctStatesAndTopics, subscribeUser, getSubscriptions } from '../models/subscriptionModel';
import newsEventEmitter from '../utils/newsEventEmitter';
const API_RATE_LIMIT_DELAY = 3000; // 3 seconds delay between requests
const MAX_REQUESTS_PER_DAY = 100;

const fetchAndStoreNews = async (states: string[], topics: string[], search?: string) => {
  try {
    const articles: any[] = [];
    let totalRequests = 0;

    const providers = NewsProviderFactory.getAvailableProviders() || [];
    if (providers.length === 0) {
      console.log("No available providers. Exiting fetch.");
      return;
    }

    for (const topic of topics) {
      for (const provider of providers) {
        if (totalRequests >= MAX_REQUESTS_PER_DAY) {
          console.log("Daily API request limit reached. Stopping further requests.");
          break;
        }

        console.log(`Fetching news for topic: ${topic} from provider: ${provider.constructor.name}`);

        // Fetch articles from the current provider
        const providerArticles = await provider.fetchNews(states, [topic], search);
        articles.push(...providerArticles);

        totalRequests += 1;

        // Add delay to avoid hitting rate limits
        await new Promise((resolve) => setTimeout(resolve, API_RATE_LIMIT_DELAY));
      }
    }

    // Insert articles into the database
    for (const article of articles) {
      const exists = await checkArticleExists(article.link);
      if (!exists || new Date(article.date) > new Date(exists)) {
        const addedArticle = await addNewsToDB(article);
        if (addedArticle) {
          newsEventEmitter.emit("newArticle", addedArticle);
        }
      }
    }

    console.log(`Fetched and stored ${articles.length} articles from all providers.`);
  } catch (error) {
    console.error("Error fetching or storing news:", error);
    throw new Error("Failed to fetch and store news");
  }
};


// GET /news/external
export const fetchExternalNews = async (req: Request, res: Response) => {
  const { state, topic, search } = req.query;

  try {
    // Ensure states and topics are arrays
    const states = state ? String(state).split(',') : ['General']
    const topics = topic ? String(topic).split(',') : ['General'];

    const articles = await fetchAndStoreNews(states, topics, search ? String(search) : '');
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// Cron job
export const runCronJobForNews = async () => {
  console.log('Running scheduled news fetch...');
  try {
    // Fetch distinct states and topics from the subscription table
    const { states, topics } = await getDistinctStatesAndTopics();

    if (!states.length || !topics.length) {
      console.log('No distinct states or topics found. Skipping fetch.');
      return;
    }
    // Fetch and store news based on distinct states and topics
    await fetchAndStoreNews(states, topics);
    console.log('Scheduled news fetch completed successfully.');
  } catch (error) {
    console.error('Error during scheduled news fetch:', error);
  }
};  

// News Cache
const newsCache = new Map<string, { articles: any[]; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // Cache duration: 10 minutes
const getCacheKey = (filters: { states: string[]; topics: string[]; search: string; page: number; limit: number }): string => {
  const { states, topics, search, page, limit } = filters;
  return `${states.sort().join(',')}-${topics.sort().join(',')}-${search || ''}-page:${page}-limit:${limit}`;
};

const isCacheValid = (key: string): boolean => {
  const cached = newsCache.get(key);
  return cached ? cached.expiry > Date.now() : false;
};

// GET /news
export const getNews = async (req: Request, res: Response) => {
  try {
    const { userId, state, topic, search, page = '1', limit = '10' } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    // Parse filters for multiple states and topics
    let states = state ? String(state).split(',') : [];
    let topics = topic ? String(topic).split(',') : [];
    if (states.length === 0 || topics.length === 0) {
      console.log(`No state/topic provided. Fetching subscriptions for user ${userId}`);
      const subscriptions = await getSubscriptions(Number(userId));
      states = subscriptions.states;
      topics = subscriptions.topics;
    }
    const searchTerm = search ? String(search) : '';
    // Create Cache key
    const cacheKey = getCacheKey({ states, topics, search: searchTerm, page: pageNumber, limit: limitNumber });

    // Check cache
    if (isCacheValid(cacheKey)) {
      console.log('Cool, found cached news, serving news from cache.');
      return res.json(newsCache.get(cacheKey)?.articles || []);
    }

    // Fetch filtered and paginated news from the database
    const news = await getAllNews({ states, topics, search: searchTerm }, limitNumber, offset);

    // If no news is found in the db, trigger fetching from the external source
    if (news.length === 0 && (states.length > 0 || topics.length > 0)) {
      console.log('No articles found in the db, fetching from external...');
      await fetchAndStoreNews(states, topics, searchTerm);

      // Re-fetch news from the database after external fetch done
      const updatedNews = await getAllNews({ states, topics, search: searchTerm }, limitNumber, offset);

      // Update cache
      newsCache.set(cacheKey, { articles: updatedNews, expiry: Date.now() + CACHE_TTL });

      return res.json(updatedNews);
    }

    // Update cache with the fetched news
    newsCache.set(cacheKey, { articles: news, expiry: Date.now() + CACHE_TTL });

    return res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

// GET /news/:id 
export const getNewsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsArticle = await getNewsByIdFromDB(Number(id));
    if (newsArticle) {
      res.json(newsArticle);
    } else {
      res.status(404).json({ error: 'News article not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news article' });
  }
};

// POST /news 
export const addNewsArticle = async (req: Request, res: Response, broadcast: (message: any) => void) => {
  try {
    const { title, summary, state, topic, date, link, imageUrl } = req.body;

    // Add article to the database
    const newArticle = await addNewsToDB({ title, summary, state, topic, date, link, imageUrl });
    newsCache.clear();
    // Notify connected clients about the new article
    if (broadcast) {
      broadcast({ type: 'NEW_ARTICLE', article: newArticle });
    }

    res.status(201).json(newArticle);
  } catch (error) {
    console.error('Error adding news article:', error);
    res.status(500).json({ error: 'Failed to add news article' });
  }
};

// Subscribe a user to news updates
export const subscribeToNews = async (req: Request, res: Response) => {
  const { userId, states, topics } = req.body;

  if (!userId || !states || !topics) {
    return res.status(400).json({ error: 'Missing userId, states, or topics' });
  }

  try {
    // Subscribe the user
    await subscribeUser(userId, states, topics);

    // Clear the news cache
    newsCache.clear();
    console.log('News cache cleared after subscription update.');
    // Prefetch news for the updated subscriptions
    await fetchAndStoreNews(states, topics);

    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing user:', error);
    res.status(500).json({ error: 'Failed to subscribe to news' });
  }
};

