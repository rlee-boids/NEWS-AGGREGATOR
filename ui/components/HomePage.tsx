import { useState, useEffect } from 'react';
import NewsList from '../components/NewsList';
import FilterSearch from '../components/FilterSearch';
import { useRouter } from 'next/router';

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
  const [subscriptions, setSubscriptions] = useState<{ states: string[]; topics: string[] }>({
    states: [],
    topics: [],
  });
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<{ state: string; topic: string; search: string }>({
    state: '',
    topic: '',
    search: '',
  });
  const router = useRouter();

  // Fetch user subscriptions
  const fetchSubscriptions = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/subscriptions?userId=${userId}`);
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  // Fetch articles with pagination and filters
  const fetchArticles = async (page: number, newFilters: typeof filters = filters, userId: Number) => {
    if (!user) return; // Ensure 'user' is loaded before fetching articles

    setLoading(true);
    try {
      let { state, topic, search } = newFilters;

      //  Use specific filters otherwise use subscriptions
      state = state || subscriptions.states.join(',');
      topic = topic || subscriptions.topics.join(',');

      let response = await fetch(
        `http://localhost:5000/news?userId=${userId}&state=${state}&topic=${topic}&search=${search}&page=${page}&limit=10`
      );
      if (response.status === 429) { // rate limit reached
          window.location.href = '/login?error=rate-limit'; 
      }
      else if (response.ok) {
        let data = await response.json();

        // If no articles are found, fetch from external sources
        if (data.length === 0 && (subscriptions.states.length > 0 || subscriptions.topics.length > 0)) {
          console.log("No articles found in the database, fetching from external sources...");
          const externalResponse = await fetch(
            `http://localhost:5000/news/external?state=${state}&topic=${topic}`
          );
          const externalData = await externalResponse.json();

          // Re-fetch news after external fetch
          response = await fetch(
            `http://localhost:5000/news?userId=${userId}&state=${state}&topic=${topic}&search=${search}&page=${page}&limit=10`
          );
          data = await response.json();

          if (externalData.length) {
            console.log("External articles successfully fetched and stored in the database.");
          }
        }

        if (data.length < 10) {
          setHasMore(false);
        }

        setArticles((prevArticles) => (page === 1 ? data : [...prevArticles, ...data]));
      }
      else {
        throw new Error('Failed to fetch articles');
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load user data, subscriptions, and articles when the user logs in
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchSubscriptions(parsedUser.id).then(() => {
        fetchArticles(1, filters, parsedUser.id); // Fetch articles after subscriptions loaded
        setPage(1);
        setHasMore(true);
      });
    } else {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (page > 1) {
      fetchArticles(page, filters, user.id);
    }
  }, [page, user]);

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
        if (!loading && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

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
      <NewsList articles={articles} onArticleClick={handleArticleClick} />
      {loading && <p>Loading more articles...</p>}
      {!hasMore && <p>No more articles to load.</p>}
    </div>
  );
}
