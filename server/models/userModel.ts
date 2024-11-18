import { getDbConnection } from '../db/sqlite';

export interface User {
  id: number;
  username: string;
  password: string;
  topics: string[];
}

export const createUser = async (username: string, password: string, topics: string[], states: string[]) => {
  const db = await getDbConnection();

  try {
    await db.run('BEGIN TRANSACTION');

    // Insert user into the users table
    const result = await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );

    const userId = result.lastID;

    // Insert initial subscriptions into the subscription table
    for (const state of states) {
      for (const topic of topics) {
        await db.run(
          'INSERT INTO subscriptions (userId, state, topic) VALUES (?, ?, ?)',
          [userId, state, topic]
        );
      }
    }

    await db.run('COMMIT');
    console.log('User created and subscriptions added successfully');
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error creating user or adding subscriptions:', error);
    throw error;
  } finally {
    db.close();
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const db = await getDbConnection();
  const query = 'SELECT * FROM users WHERE username = ?';
  const user = await db.get(query, [username]);
  return user || null;
};

