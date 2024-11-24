import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import userRoutes from './routes/userRoutes';
import newsRoutes from './routes/newsRoutes';
import cron from 'node-cron';
import { runCronJobForNews } from './controllers/newsController';
import subscriptionRoutes from './routes/subscriptionRoutes';
import { newsRateLimiter }  from './middlewares/rateLimiter';

config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/news', newsRateLimiter);
app.use('/news', newsRoutes);
app.use('/user', userRoutes);
app.use('/subscriptions', subscriptionRoutes);
// Schedule the news aggregation script to run every half hour
cron.schedule('*/30 * * * *', async () => {
  await runCronJobForNews();
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});