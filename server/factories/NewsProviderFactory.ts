import { NewsAPIProvider } from '../providers/NewsAPIProvider';
import { CurrentsAPIProvider } from '../providers/CurrentsAPIProvider';
import { NewsProvider } from '../providers/NewsProviderInterface';

export class NewsProviderFactory {
  static getProviders(): NewsProvider[] {
    return [
      new NewsAPIProvider(),
      new CurrentsAPIProvider(),
    ];
  }

  static getAvailableProviders(): NewsProvider[] {
    const providers = this.getProviders();
    const availableProviders = providers.filter((provider) => provider.getRemainingRequests() > 0);

    if (availableProviders.length === 0) {
      console.log('No providers available within the daily request limits.');
      return [];
    }

    return availableProviders.sort((a, b) => b.getRemainingRequests() - a.getRemainingRequests());
  }
}
