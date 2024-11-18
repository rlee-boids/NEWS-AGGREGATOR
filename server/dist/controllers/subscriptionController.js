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
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUserSubscription = exports.addUserSubscription = exports.getUserSubscriptions = void 0;
const subscriptionModel_1 = require("../models/subscriptionModel");
const getUserSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    try {
        const subscriptions = yield (0, subscriptionModel_1.getSubscriptions)(Number(userId));
        res.json(subscriptions);
    }
    catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});
exports.getUserSubscriptions = getUserSubscriptions;
const addUserSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, state, topic } = req.body;
    if (!userId || !state || !topic) {
        return res.status(400).json({ error: 'userId, state, and topic are required' });
    }
    try {
        yield (0, subscriptionModel_1.addSubscription)(userId, state, topic);
        res.status(201).json({ success: true, message: 'Subscription added successfully!' });
    }
    catch (error) {
        console.error('Error adding subscription:', error);
        res.status(500).json({ error: 'Failed to add subscription' });
    }
});
exports.addUserSubscription = addUserSubscription;
const removeUserSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, state, topic } = req.body;
    if (!userId || !state || !topic) {
        return res.status(400).json({ error: 'userId, state, and topic are required' });
    }
    try {
        yield (0, subscriptionModel_1.removeSubscription)(userId, state, topic);
        res.status(200).json({ success: true, message: 'Subscription removed successfully!' });
    }
    catch (error) {
        console.error('Error removing subscription:', error);
        res.status(500).json({ error: 'Failed to remove subscription' });
    }
});
exports.removeUserSubscription = removeUserSubscription;
