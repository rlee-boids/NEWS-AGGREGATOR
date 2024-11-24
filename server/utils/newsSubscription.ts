import { getDbConnection } from '../db/sqlite';

// Add or update subscriptions for a user
export const subscribeUser = async (userId: number, states: string[], topics: string[]) => {
  const db = await getDbConnection();

  try {
    // Begin a transaction
    await db.run('BEGIN TRANSACTION');

    // Remove existing subscriptions for the user
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

    // Commit the transaction
    await db.run('COMMIT');
    console.log(`User ${userId} subscribed to states: ${states}, topics: ${topics}`);
  } catch (error) {
    // Rollback in case of error
    await db.run('ROLLBACK');
    console.error(`Error subscribing user ${userId}:`, error);
    throw error;
  } finally {
    db.close();
  }
};

// Remove all subscriptions for a user
export const unsubscribeUser = async (userId: number) => {
  const db = await getDbConnection();

  try {
    await db.run('DELETE FROM subscriptions WHERE userId = ?', [userId]);
    console.log(`User ${userId} unsubscribed.`);
  } catch (error) {
    console.error(`Error unsubscribing user ${userId}:`, error);
    throw error;
  } finally {
    db.close();
  }
};

// Get subscriptions for a user
export const getUserSubscriptions = async (userId: number) => {
  const db = await getDbConnection();

  try {
    const rows = await db.all('SELECT state, topic FROM subscriptions WHERE userId = ?', [userId]);

    const states = Array.from(new Set(rows.map((row: { state: string }) => row.state)));
    const topics = Array.from(new Set(rows.map((row: { topic: string }) => row.topic)));

    return { states, topics };
  } catch (error) {
    console.error(`Error fetching subscriptions for user ${userId}:`, error);
    throw error;
  } finally {
    db.close();
  }
};

// Get all subscriptions (optional, for debugging or admin purposes)
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
