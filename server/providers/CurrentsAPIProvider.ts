import axios from 'axios';
import { NewsProvider } from './NewsProviderInterface';
import { determineState } from '../utils/determineState';

export class CurrentsAPIProvider implements NewsProvider {
  private apiKey = process.env.CURRENTS_API_KEY || 'IqM3WqRnnzHBmZV0SC_ziq9YmRuaMOtgy4dyBe-VQrVc41-M';
  private baseUrl = process.env.CURRENTS_API_URL ||'https://api.currentsapi.services/v1/latest-news';
  private dailyLimit = 600;
  private usedRequests = 0;

  async fetchNews(states: string[], topics: string[], search?: string) {
    if (this.usedRequests >= this.dailyLimit) {
      console.log('CurrentsAPI: Daily limit reached.');
      return [];
    }

    const topic = topics[0];

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          keywords: search || '',
          language: 'en',
          apiKey: this.apiKey,
        },
      });

      // Filter articles where `category` matches the provided topic.
      const articles = response.data.news
        .filter((article: any) => article.category && article.category.includes(topic.toLowerCase()))
        .map((article: any) =>{
            const determinedState = determineState(article.title, article.description, states);
            return {
                title: article.title,
                summary: article.description,
                state: determinedState,
                topic,
                date: article.published,
                link: article.url,
                imageUrl: article.image,
            }
        });

      this.trackUsage();
      return articles;
    } catch (error:any) {
      console.error(`Error fetching news from CurrentsAPI for topic "${topic}":`, error.message);
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
