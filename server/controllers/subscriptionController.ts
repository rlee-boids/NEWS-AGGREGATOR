import { Request, Response } from 'express';
import { getSubscriptions, addSubscription, removeSubscription} from '../models/subscriptionModel';

export const getUserSubscriptions = async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const subscriptions = await getSubscriptions(Number(userId));
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
};

export const addUserSubscription = async (req: Request, res: Response) => {
  const { userId, state, topic } = req.body;

  if (!userId || !state || !topic) {
    return res.status(400).json({ error: 'userId, state, and topic are required' });
  }

  try {
    await addSubscription(userId, state, topic);
    res.status(201).json({ success: true, message: 'Subscription added successfully!' });
  } catch (error) {
    console.error('Error adding subscription:', error);
    res.status(500).json({ error: 'Failed to add subscription' });
  }
};

export const removeUserSubscription = async (req: Request, res: Response) => {
  const { userId, state, topic } = req.body;

  if (!userId || !state || !topic) {
    return res.status(400).json({ error: 'userId, state, and topic are required' });
  }

  try {
    await removeSubscription(userId, state, topic);
    res.status(200).json({ success: true, message: 'Subscription removed successfully!' });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
};
