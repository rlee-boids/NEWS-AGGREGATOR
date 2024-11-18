import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { createUser, getUserByUsername } from '../models/userModel';
import { addSubscription } from '../models/subscriptionModel';

// Register new user
export const registerUser = async (req: Request, res: Response) => {
  const { username, password, states, topics } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  if (!username || !password || !states?.length || !topics?.length) {
    return res.status(400).json({ error: 'Username, password, states, and topics are required' });
  }

  try {
    await createUser(username, hashedPassword, topics, states);
    res.status(201).json({ success: true, message: 'User registered successfully!' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// User login
export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await getUserByUsername(username);

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({ message: 'Login successful', user });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};
