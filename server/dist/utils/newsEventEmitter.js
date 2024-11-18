"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const subscriptionModel_1 = require("../models/subscriptionModel");
const notificationService_1 = __importDefault(require("../utils/notificationService"));
// Create and configure the EventEmitter instance
const newsEventEmitter = new events_1.EventEmitter();
// Set a maximum number of listeners to prevent memory leaks
newsEventEmitter.setMaxListeners(50);
// Listener for the `newArticle` event
newsEventEmitter.on('newArticle', (article) => __awaiter(void 0, void 0, void 0, function* () {
    const subscriptions = yield (0, subscriptionModel_1.getAllSubscriptions)();
    for (const [userId, { states, topics }] of Object.entries(subscriptions)) {
        const isStateMatched = states.includes(article.state);
        const isTopicMatched = article.topic.split(',').some((topic) => topics.includes(topic));
        if (isStateMatched || isTopicMatched) {
            console.log(`Notifying user ${userId} about new article: ${article.title}`);
            yield (0, notificationService_1.default)(userId, article); // Replace with your notification logic
        }
    }
}));
// Export the EventEmitter for use in the application
exports.default = newsEventEmitter;
