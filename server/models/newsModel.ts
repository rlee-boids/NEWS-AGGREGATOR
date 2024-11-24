import { getDbConnection } from '../db/sqlite';

interface NewsArticle {
  id?: number;
  title: string;
  summary: string;
  state: string;
  topic: string;
  date: string;
  link: string;
  imageUrl?: string;
}

// Retrieve all news articles with filters
export const getAllNews = async (filters: { states: string[]; topics: string[]; search: string }, limit: number, offset: number): Promise<any[]> => {
  const db = await getDbConnection();
  try {
    const { states, topics, search } = filters;

    let query = `SELECT id,
                        title,
                        summary,
                        state,
                        topic,
                        date,
                        link,
                        imageUrl 
                        FROM news WHERE 1=1`;

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

    // Add sorting by date (latest first)
    query += ` ORDER BY date DESC`;

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
export const addNewsToDB = async (article: NewsArticle): Promise<NewsArticle | null> => {
  const db = await getDbConnection();
  const { title, summary, state, topic, date, link, imageUrl } = article;

  try {
    const result = await db.run(
      'INSERT INTO news (title, summary, state, topic, date, link, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)',
      title, summary, state, topic, date, link, imageUrl
    );
    return { id: result.lastID, ...article };
  } catch (error:any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      console.log(`Duplicate article detected for link: ${link}. Skipping insertion.`);
      return null; // Article already exists, return null
    } else {
      console.error('Error adding news to the database:', error);
      throw error; // Re-throw other errors
    }
  } finally {
    await db.close();
  }
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

// Check if artical exsits
export const checkArticleExists = async (link: string): Promise<string | null> => {
  const db = await getDbConnection();
  try {
    const query = `
      SELECT MAX(date) AS latestDate, link
      FROM news
      WHERE link LIKE ?`;
    const result = await db.get(query, [`%${link}%`]);
    return result?.latestDate || null;
  } catch (error) {
    console.error('Error fetching latest news date:', error);
    throw error;
  } finally {
    await db.close();
  }
};
