import { getDbConnection } from '../db/sqlite';

export const addSubscription = async (userId: number, state: string, topic: string) => {
  const db = await getDbConnection();
  try {
    await db.run(
      `INSERT INTO subscriptions (userId, state, topic) VALUES (?, ?, ?)`,
      userId,
      state,
      topic
    );
  } finally {
    db.close();
  }
};

export const removeSubscription = async (userId: number, state: string, topic: string) => {
    const db = await getDbConnection();
    try {
      await db.run(
        `DELETE FROM subscriptions WHERE userId = ? AND state = ? AND topic = ?`,
        userId,
        state,
        topic
      );
    } finally {
      db.close();
    }
  };
  
// Get subscription by user
export const getSubscriptions = async (userId: number) => {
    const db = await getDbConnection();
    try {
        // Fetch distinct states and topics from the subscription table
        const states = await db.all(`SELECT DISTINCT state FROM subscriptions WHERE userId = ?`, userId);
        const topics = await db.all(`SELECT DISTINCT topic FROM subscriptions WHERE userId = ?`, userId);

        return {
            states: states.map((row: { state: string }) => row.state),
            topics: topics.map((row: { topic: string }) => row.topic),
        };
    } catch (error) {
        console.error('Error fetching distinct states and topics:', error);
        throw error;
    } finally {
        db.close();
    }
};
// This is for the cron job
export const getDistinctStatesAndTopics = async () => {
    const db = await getDbConnection();
    try {
        // Query to fetch distinct states and topics from the subscription table
        const states = await db.all(`SELECT DISTINCT state FROM subscriptions`);
        const topics = await db.all(`SELECT DISTINCT topic FROM subscriptions`);

        return {
        states: states.map((row: { state: string }) => row.state),
        topics: topics.map((row: { topic: string }) => row.topic),
        };
    } catch (error) {
        console.error('Error fetching distinct states and topics:', error);
        throw error;
    } finally {
        db.close();
    }
};

// Add or update subscriptions for a user
export const subscribeUser = async (userId: number, states: string[], topics: string[]) => {
    const db = await getDbConnection();
  
    try {
      await db.run('BEGIN TRANSACTION');
  
      // Remove existing subscriptions for the user first
      await db.run('DELETE FROM subscriptions WHERE userId = ?', [userId]);
  
      // Add new subscriptions for each combination of states and topics
      for (const state of states) {
        for (const topic of topics) {
          await db.run('INSERT INTO subscriptions (userId, state, topic) VALUES (?, ?, ?)', [
            userId,
            state,
            topic,
          ]);
        }
      }

      await db.run('COMMIT');
      console.log(`User ${userId} subscribed to states: ${states}, topics: ${topics}`);
    } catch (error) {
      await db.run('ROLLBACK');
      console.error(`Error subscribing user ${userId}:`, error);
      throw error;
    } finally {
      db.close();
    }
};
// Get all subscriptions
export const getAllSubscriptions = async () => {
    const db = await getDbConnection();
  
    try {
      const rows = await db.all('SELECT userId, state, topic FROM subscriptions');
      const subscriptions: { [userId: number]: { states: string[]; topics: string[] } } = {};
  
      for (const row of rows) {
        if (!subscriptions[row.userId]) {
          subscriptions[row.userId] = { states: [], topics: [] };
        }
  
        subscriptions[row.userId].states.push(row.state);
        subscriptions[row.userId].topics.push(row.topic);
      }
  
      // Remove duplicates in states and topics for each user
      for (const userId in subscriptions) {
        subscriptions[userId].states = Array.from(new Set(subscriptions[userId].states));
        subscriptions[userId].topics = Array.from(new Set(subscriptions[userId].topics));
      }
  
      return subscriptions;
    } catch (error) {
      console.error('Error fetching all subscriptions:', error);
      throw error;
    } finally {
      db.close();
    }
  };