import express from 'express';
import  WebSocket from 'ws';
import { getNews, getNewsById, addNewsArticle, fetchExternalNews} from '../controllers/newsController';
import { subscribeToNews } from '../controllers/newsController';

const wss = new WebSocket.Server({ port: 8081 }); // Create WebSocket server

// Broadcast a message to all connected clients
const broadcast = (message: any) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

const router = express.Router();
// GET /external - Fetch news from an external API
router.get('/external', fetchExternalNews);

// POST /subscribe - Subscribe to news updates
router.post('/subscribe', subscribeToNews);

// GET /news - Retrieves list of news
router.get('/', getNews);

// GET /news/:id - Retrieves detailed news by news ID
router.get('/:id', getNewsById);

// POST /news - Add a news article
router.post('/', (req, res) => addNewsArticle(req, res, broadcast)); // Pass broadcast to addNewsArticle

export default router;
