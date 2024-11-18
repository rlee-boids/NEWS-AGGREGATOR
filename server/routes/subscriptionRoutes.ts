import express from 'express';
import { getUserSubscriptions } from '../controllers/subscriptionController';

const router = express.Router();
//GET /subscriptions - get user subscriptions
router.get('/', getUserSubscriptions);

export default router;
