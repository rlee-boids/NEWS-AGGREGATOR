"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const newsController_1 = require("../controllers/newsController");
const newsController_2 = require("../controllers/newsController");
const router = express_1.default.Router();
// Route to fetch news from an external API
router.get('/external', newsController_1.fetchExternalNews);
// Route to subscribe to news updates
router.post('/subscribe', newsController_2.subscribeToNews);
// GET /news - Retrieves a list of news articles with optional filters
router.get('/', newsController_1.getNews);
// GET /news/:id - Retrieves detailed information for a specific news article by ID
router.get('/:id', newsController_1.getNewsById);
// POST /news - Adds a new news article (for testing purposes)
router.post('/', newsController_1.addNewsArticle);
exports.default = router;
