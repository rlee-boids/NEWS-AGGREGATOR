import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

(async () => {
  const db = await open({
    filename: './news.db',
    driver: sqlite3.Database,
  });

  // Create the 'news' table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      summary TEXT,
      state TEXT,
      topic TEXT,
      date TEXT,
      link TEXT
    );
  `);

  // Create indexes for the 'news' table
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_state ON news(state);
    CREATE INDEX IF NOT EXISTS idx_news_topic ON news(topic);
    CREATE INDEX IF NOT EXISTS idx_news_date ON news(date);
    CREATE INDEX idx_news_state_topic_date ON news (state, topic, date);
  `);

  // Create the 'users' table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  // Create an index for the 'users' table
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Create the 'subscriptions' table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      state TEXT NOT NULL,
      topic TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Create indexes for the 'subscriptions' table
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions(userId);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_state ON subscriptions(state);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_topic ON subscriptions(topic);
  `);

  console.log("Database initialized with indexes for news, users, and subscriptions tables.");

  await db.close();
})();
