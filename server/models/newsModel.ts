import { getDbConnection } from '../db/sqlite';

interface NewsArticle {
  id?: number;
  title: string;
  summary: string;
  state: string;
  topic: string;
  date: string;
  link: string;
}

// Retrieve all news articles with filters
export const getAllNews = async (filters: { states: string[]; topics: string[]; search: string }, limit: number, offset: number): Promise<any[]> => {
  const db = await getDbConnection();
  try {
    const { states, topics, search } = filters;

    let query = `SELECT * FROM news WHERE 1=1`;

    // States filter
    if (states.length > 0) {
      const statePlaceholders = states.map(() => '?').join(', ');
      query += ` AND state IN (${statePlaceholders})`;
    }

    // Topics filter 
    if (topics.length > 0) {
      const topicConditions = topics.map(() => `topic LIKE ?`).join(' OR ');
      query += ` AND (${topicConditions})`;
    }

    // Search filter
    if (search) {
      query += ` AND (title LIKE ? OR summary LIKE ?)`;
    }

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;

    // Build query
    const topicParams = topics.map(topic => `%${topic}%`);
    const params = [
      ...states,
      ...topicParams,
      ...(search ? [`%${search}%`, `%${search}%`] : []),
      limit,
      offset,
    ];

    //console.log('Query:', query);
    //console.log('Parameters:', params);

    return await db.all(query, params);
  } catch (error) {
    console.error('Error fetching news:', error);
    throw new Error('Failed to fetch news');
  } finally {
    await db.close();
  }
};


// Retrieve news article by ID
export const getNewsByIdFromDB = async (id: number) => {
  const db = await getDbConnection();
  return db.get('SELECT * FROM news WHERE id = ?', id);
};

// Add a new news article
export const addNewsToDB = async (article: NewsArticle) => {
  const db = await getDbConnection();
  const { title, summary, state, topic, date, link } = article;
  const result = await db.run(
    'INSERT INTO news (title, summary, state, topic, date, link) VALUES (?, ?, ?, ?, ?, ?)',
    title, summary, state, topic, date, link
  );
  return { id: result.lastID, ...article };
};

// Get the latest news date for a given state and topic
export const getLatestNewsDate = async (state: string, topic: string): Promise<string | null> => {
  const db = await getDbConnection();
  try {
    const query = `
      SELECT MAX(date) AS latestDate
      FROM news
      WHERE state = ? AND topic LIKE ?`;
    const result = await db.get(query, [state, `%${topic}%`]);
    return result?.latestDate || null;
  } catch (error) {
    console.error('Error fetching latest news date:', error);
    throw error;
  } finally {
    await db.close();
  }
};
