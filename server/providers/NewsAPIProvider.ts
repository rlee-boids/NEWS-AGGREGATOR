import axios from 'axios';
import { NewsProvider } from './NewsProviderInterface';
import { determineState } from '../utils/determineState';

export class NewsAPIProvider implements NewsProvider {
  private apiKey = process.env.NEWS_API_KEY || 'default_newsapi_key';
  private baseUrl = 'https://newsapi.org/v2/top-headlines';
  private dailyLimit = 100;
  private usedRequests = 0;

  async fetchNews(states: string[], topics: string[], search?: string) {
    if (this.usedRequests >= this.dailyLimit) {
      console.log('NewsAPI: Daily limit reached.');
      return [];
    }

    const topic = topics[0]; // Extract the single topic from the provided array.
    try {
        const response = await axios.get(this.baseUrl, {
            params: {
                country: 'us',
                category: topic.toLowerCase(),
                q: search,
                language: 'en',
                apiKey: this.apiKey,
                pageSize: 100,
            },
        });
    
        const articles = response.data.articles.map((article: any) => {
            const determinedState = determineState(article.title, article.description, states);
            return {
                title: article.title,
                summary: article.description,
                state: determinedState,
                topic,
                date: article.publishedAt,
                link: article.url,
                imageUrl: article.urlToImage,
            }
        });
    
        this.trackUsage();
        return articles;
    }
    catch (error:any) {
        console.error(`Error fetching news from NewsAPI for topic "${topic}":`, error.message);
        return [];
    }
  }

  getDailyLimit() {
    return this.dailyLimit;
  }

  trackUsage() {
    this.usedRequests++;
  }

  getRemainingRequests() {
    return this.dailyLimit - this.usedRequests;
  }
}
