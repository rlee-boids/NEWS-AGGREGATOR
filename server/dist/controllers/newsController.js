"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToNews = exports.addNewsArticle = exports.getNewsById = exports.getNews = exports.runCronJobForNews = exports.fetchExternalNews = exports.fetchAndStoreNews = void 0;
const axios_1 = __importDefault(require("axios"));
const newsModel_1 = require("../models/newsModel");
const subscriptionModel_1 = require("../models/subscriptionModel");
const newsEventEmitter_1 = __importDefault(require("../utils/newsEventEmitter"));
const determineState_1 = require("../utils/determineState");
const stateKeywords_1 = require("../config/stateKeywords");
const NEWS_API_KEY = process.env.NEWS_API_URL || '77c0665d133844d2bcff8bc3e7eb8300';
const NEWS_API_URL = process.env.NEWS_API_KEY || 'https://newsapi.org/v2/everything';
// Get /news/external - Retrieves a list of news articles from external source with optional filters
const fetchAndStoreNews = (states, topics, search) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Define the shape of latestDates
        const latestDates = {};
        // Fetch the latest news dates for all states and topics
        for (const state of states) {
            for (const topic of topics) {
                const latestDate = yield (0, newsModel_1.getLatestNewsDate)(state, topic);
                latestDates[`${state}-${topic}`] = latestDate || null;
            }
        }
        // Combine states and topics into a single query
        const combinedQuery = [
            search,
            ...states,
            ...topics,
        ]
            .filter(Boolean)
            .join(' OR ');
        // Use the earliest date across all combinations for the 'from' parameter
        const earliestDate = Object.values(latestDates).reduce((earliest, date) => {
            if (!earliest || (date && date < earliest)) {
                return date;
            }
            return earliest;
        }, null);
        // Fetch articles from external API
        const response = yield axios_1.default.get(NEWS_API_URL, {
            params: {
                q: combinedQuery,
                from: earliestDate || undefined, // Fetch only newer articles
                language: 'en',
                sortBy: 'publishedAt',
                apiKey: NEWS_API_KEY,
                pageSize: 100,
            },
        });
        // Filter and format articles
        const articles = response.data.articles
            .filter((article) => {
            return article && article.title && article.description && article.publishedAt && article.url;
        })
            .map((article) => {
            const determinedState = (0, determineState_1.determineState)(article.title, article.description);
            return {
                title: article.title,
                summary: article.description,
                state: determinedState,
                topic: topics.join(','), // Join topics into a string
                date: article.publishedAt,
                link: article.url,
            };
        });
        // Insert only new articles
        const newArticles = [];
        for (const article of articles) {
            const exists = yield (0, newsModel_1.getLatestNewsDate)(article.state, article.topic); // Re-check if article exists
            if (!exists || new Date(article.date) > new Date(exists)) {
                yield (0, newsModel_1.addNewsToDB)(article);
                newArticles.push(article);
                newsEventEmitter_1.default.emit('newArticle', article);
            }
        }
        console.log(`Fetched and stored ${newArticles.length} new articles.`);
        return newArticles;
    }
    catch (error) {
        console.error('Error fetching or storing news:', error);
        throw new Error('Failed to fetch and store news');
    }
});
exports.fetchAndStoreNews = fetchAndStoreNews;
// HTTP handler for /news/external
const fetchExternalNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { state, topic, search } = req.query;
    try {
        // Ensure states and topics are arrays
        const states = state ? String(state).split(',') : Object.keys(stateKeywords_1.stateKeywords); // Use all states if none specified
        const topics = topic ? String(topic).split(',') : ['General'];
        const articles = yield (0, exports.fetchAndStoreNews)(states, topics, search ? String(search) : undefined);
        res.json(articles);
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
});
exports.fetchExternalNews = fetchExternalNews;
// Cron job integration
const runCronJobForNews = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Running scheduled news fetch...');
    try {
        // Fetch distinct states and topics from the subscription table
        const { states, topics } = yield (0, subscriptionModel_1.getDistinctStatesAndTopics)();
        if (!states.length || !topics.length) {
            console.log('No distinct states or topics found. Skipping news fetch.');
            return;
        }
        // Fetch and store news based on distinct states and topics
        yield (0, exports.fetchAndStoreNews)(states, topics);
        console.log('Scheduled news fetch completed successfully.');
    }
    catch (error) {
        console.error('Error during scheduled news fetch:', error);
    }
});
exports.runCronJobForNews = runCronJobForNews;
const newsCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // Cache duration: 10 minutes
const getCacheKey = (filters) => {
    const { states, topics, search, page, limit } = filters;
    return `${states.sort().join(',')}-${topics.sort().join(',')}-${search || ''}-page:${page}-limit:${limit}`;
};
const isCacheValid = (key) => {
    const cached = newsCache.get(key);
    return cached ? cached.expiry > Date.now() : false;
};
// GET /news - Retrieves a list of news articles with optional filters
const getNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId, state, topic, search, page = '1', limit = '10' } = req.query;
        // Parse pagination parameters
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const offset = (pageNumber - 1) * limitNumber;
        // Parse filters for multiple states and topics
        let states = state ? String(state).split(',') : [];
        let topics = topic ? String(topic).split(',') : [];
        if (states.length === 0 || topics.length === 0) {
            console.log(`No state/topic provided. Fetching subscriptions for user ${userId}`);
            const subscriptions = yield (0, subscriptionModel_1.getSubscriptions)(Number(userId));
            states = subscriptions.states;
            topics = subscriptions.topics;
        }
        const searchTerm = search ? String(search) : '';
        // Generate cache key
        const cacheKey = getCacheKey({ states, topics, search: searchTerm, page: pageNumber, limit: limitNumber });
        // Check cache
        if (isCacheValid(cacheKey)) {
            console.log('Serving news from cache.');
            return res.json(((_a = newsCache.get(cacheKey)) === null || _a === void 0 ? void 0 : _a.articles) || []);
        }
        // Fetch filtered and paginated news from the database
        const news = yield (0, newsModel_1.getAllNews)({ states, topics, search: searchTerm }, limitNumber, offset);
        // If no news is found in the database, trigger fetching from the external source
        if (news.length === 0 && (states.length > 0 || topics.length > 0)) {
            console.log('No articles found in the database, fetching from external sources...');
            yield (0, exports.fetchAndStoreNews)(states, topics, searchTerm);
            // Re-fetch news from the database after external fetch
            const updatedNews = yield (0, newsModel_1.getAllNews)({ states, topics, search: searchTerm }, limitNumber, offset);
            // Update cache
            newsCache.set(cacheKey, { articles: updatedNews, expiry: Date.now() + CACHE_TTL });
            return res.json(updatedNews);
        }
        // Update cache with the fetched news
        newsCache.set(cacheKey, { articles: news, expiry: Date.now() + CACHE_TTL });
        return res.json(news);
    }
    catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});
exports.getNews = getNews;
// GET /news/:id - Retrieves a specific news article by ID
const getNewsById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const newsArticle = yield (0, newsModel_1.getNewsByIdFromDB)(Number(id));
        if (newsArticle) {
            res.json(newsArticle);
        }
        else {
            res.status(404).json({ error: 'News article not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch news article' });
    }
});
exports.getNewsById = getNewsById;
// POST /news - Adds a new news article
const addNewsArticle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, summary, state, topic, date, link } = req.body;
        const newArticle = yield (0, newsModel_1.addNewsToDB)({ title, summary, state, topic, date, link });
        res.status(201).json(newArticle);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add news article' });
    }
});
exports.addNewsArticle = addNewsArticle;
// Subscribe a user to news updates
const subscribeToNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, states, topics } = req.body;
    if (!userId || !states || !topics) {
        return res.status(400).json({ error: 'Missing userId, states, or topics' });
    }
    try {
        // Subscribe the user
        yield (0, subscriptionModel_1.subscribeUser)(userId, states, topics);
        // Clear the news cache
        newsCache.clear();
        console.log('News cache cleared after subscription update.');
        // Optionally, prefetch news for the updated subscriptions
        yield (0, exports.fetchAndStoreNews)(states, topics);
        res.json({ message: 'Subscribed successfully' });
    }
    catch (error) {
        console.error('Error subscribing user:', error);
        res.status(500).json({ error: 'Failed to subscribe to news' });
    }
});
exports.subscribeToNews = subscribeToNews;
