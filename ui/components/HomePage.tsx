import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const FilterSearch = dynamic(() => import('../components/FilterSearch'), { ssr: false });
const NewsList = dynamic(() => import('../components/NewsList'), { ssr: false });

interface Article {
  id: number;
  title: string;
  summary: string;
  state: string;
  topic: string;
  date: string;
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<{ states: string[]; topics: string[] }>({ states: [], topics: [] });
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<{ state: string; topic: string; search: string }>({ state: '', topic: '', search: '' });
  const [noResults, setNoResults] = useState(false); // Tracks if no articles found after both API calls
  const router = useRouter();

  // Fetch user subscriptions
  const fetchSubscriptions = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/subscriptions?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
      }
      const text = await response.text(); // Read response as text first
      const data = text ? JSON.parse(text) : {}; // Parse only if non-empty
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  // Fetch articles with pagination and filters
  const fetchArticles = async (page: number, newFilters: typeof filters = filters, userId: number) => {
    if (!user) return; // Ensure 'user' is loaded before fetching articles

    setLoadingLocal(true);
    setNoResults(false); // Reset no-results state

    try {
      let { state, topic, search } = newFilters;

      // Use specific filters otherwise use subscriptions
      state = state || subscriptions.states.join(',');
      topic = topic || subscriptions.topics.join(',');

      // Fetch from local API
      const response = await fetch(
        `http://localhost:5000/news?userId=${userId}&state=${state}&topic=${topic}&search=${search}&page=${page}&limit=10`
      );

      if (response.status === 429) {
        window.location.href = '/login?error=rate-limit';
      } else if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];

        if (data.length > 0) {
          setArticles((prevArticles) => (page === 1 ? data : [...prevArticles, ...data]));
          setHasMore(data.length === 10);
          setLoadingLocal(false);
          return;
        }
      }

      // If local API fails, try external API
      setLoadingLocal(false);
      setLoadingExternal(true);

      const externalResponse = await fetch(
        `http://localhost:5000/news/external?state=${state}&topic=${topic}`
      );

      if (externalResponse.ok) {
        const externalText = await externalResponse.text();
        const externalData = externalText ? JSON.parse(externalText) : [];

        if (externalData.length > 0) {
          setArticles((prevArticles) => (page === 1 ? externalData : [...prevArticles, ...externalData]));
          setHasMore(false); // Assume external API doesn't paginate
          setLoadingExternal(false);
          return;
        }
      }

      // If both APIs fail
      setLoadingExternal(false);
      setNoResults(true);

    } catch (error) {
      console.error('Error fetching articles:', error);
      setLoadingLocal(false);
      setLoadingExternal(false);
      setNoResults(true);
    }
  };

  // Connect to WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8081');

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NEW_ARTICLE') {
        setArticles((prevArticles) => [message.article, ...prevArticles]); // Add new article to the top
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Load user data, subscriptions, and articles when the user logs in
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchSubscriptions(parsedUser.id).then(() => {
        fetchArticles(1, filters, parsedUser.id);
        setPage(1);
        setHasMore(true);
      });
    } else {
      router.push('/login');
    }
  }, []);
  //When page is incremented, fetches the next set of articles.
  useEffect(() => {
    if (page > 1) {
      fetchArticles(page, filters, user.id);
    }
  }, [page, user]);
  //When filters change, the page state is reset to 1
  useEffect(() => {
    if (user) {
      fetchArticles(1, filters, user.id);
      setPage(1);
      setHasMore(true);
    }
  }, [filters, user]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 50) {
        if (!loadingLocal && !loadingExternal && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingLocal, loadingExternal, hasMore]);

  const handleFilterChange = (newFilters: { state: string; topic: string; search: string }) => {
    setFilters(newFilters);
  };

  const handleArticleClick = (id: number) => {
    router.push(`/${id}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  const handleManageSubscriptions = () => {
    router.push('/subscriptions');
  };

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: '#007bff',
          color: '#fff',
        }}
      >
        <h1>State Affairs - News Aggregator</h1>
        {user && (
          <div>
            <span>Welcome, {user.username}!</span>
            <button
              onClick={handleManageSubscriptions}
              style={{
                marginLeft: '1rem',
                background: 'none',
                color: 'white',
                border: '1px solid white',
                padding: '0.5rem',
                cursor: 'pointer',
              }}
            >
              Manage Subscriptions
            </button>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: '1rem',
                background: 'none',
                color: 'white',
                border: '1px solid white',
                padding: '0.5rem',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <FilterSearch onFilterChange={handleFilterChange} subscriptions={subscriptions} />
      {loadingLocal && <p>Loading articles from the local API...</p>}
      {loadingExternal && <p>Loading articles from the external API...</p>}
      {noResults && <p>No articles found. Try adjusting your filters or subscriptions.</p>}
      <NewsList articles={articles} onArticleClick={handleArticleClick} />
      {!loadingLocal && !loadingExternal && !hasMore && articles.length > 0 && <p>No more articles to load.</p>}
    </div>
  );
}
