export interface NewsProvider {
    fetchNews: (
      states: string[],
      topics: string[],
      search?: string
    ) => Promise<{
      title: string;
      summary: string;
      state: string;
      topic: string;
      date: string;
      link: string;
      imageUrl?: string;
    }[]>;
    getDailyLimit: () => number; // Daily API request limit
    trackUsage: () => void; // Tracks usage
    getRemainingRequests: () => number; // Remaining requests for the day
  }
  