import express from 'express';
import { getNews, getNewsById, addNewsArticle, fetchExternalNews} from '../controllers/newsController';
import { subscribeToNews } from '../controllers/newsController';
import { newsRateLimiter } from '../middlewares/rateLimiter';

const router = express.Router();
// GET /external - Fetch news from an external API
router.get('/external', fetchExternalNews);

// POST /subscribe - Subscribe to news updates
router.post('/subscribe', newsRateLimiter, subscribeToNews);

// GET /news - Retrieves list of news
router.get('/', newsRateLimiter, getNews);

// GET /news/:id - Retrieves detailed news by news ID
router.get('/:id', newsRateLimiter, getNewsById);

// POST /news - Add a news article
router.post('/', newsRateLimiter, addNewsArticle);

export default router;
