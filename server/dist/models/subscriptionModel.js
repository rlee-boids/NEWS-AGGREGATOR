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
exports.getAllSubscriptions = exports.subscribeUser = exports.getDistinctStatesAndTopics = exports.getSubscriptions = exports.removeSubscription = exports.addSubscription = void 0;
const sqlite_1 = require("../db/sqlite");
const addSubscription = (userId, state, topic) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        yield db.run(`INSERT INTO subscriptions (userId, state, topic) VALUES (?, ?, ?)`, userId, state, topic);
    }
    finally {
        db.close();
    }
});
exports.addSubscription = addSubscription;
const removeSubscription = (userId, state, topic) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        yield db.run(`DELETE FROM subscriptions WHERE userId = ? AND state = ? AND topic = ?`, userId, state, topic);
    }
    finally {
        db.close();
    }
});
exports.removeSubscription = removeSubscription;
const getSubscriptions = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        // Query to fetch distinct states and topics from the subscription table
        const states = yield db.all(`SELECT DISTINCT state FROM subscriptions WHERE userId = ?`, userId);
        const topics = yield db.all(`SELECT DISTINCT topic FROM subscriptions WHERE userId = ?`, userId);
        // Map the rows to extract only the values
        return {
            states: states.map((row) => row.state),
            topics: topics.map((row) => row.topic),
        };
    }
    catch (error) {
        console.error('Error fetching distinct states and topics:', error);
        throw error;
    }
    finally {
        db.close();
    }
});
exports.getSubscriptions = getSubscriptions;
const getDistinctStatesAndTopics = () => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        // Query to fetch distinct states and topics from the subscription table
        const states = yield db.all(`SELECT DISTINCT state FROM subscriptions`);
        const topics = yield db.all(`SELECT DISTINCT topic FROM subscriptions`);
        // Map the rows to extract only the values
        return {
            states: states.map((row) => row.state),
            topics: topics.map((row) => row.topic),
        };
    }
    catch (error) {
        console.error('Error fetching distinct states and topics:', error);
        throw error;
    }
    finally {
        db.close();
    }
});
exports.getDistinctStatesAndTopics = getDistinctStatesAndTopics;
// Add or update subscriptions for a user
const subscribeUser = (userId, states, topics) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        // Begin a transaction
        yield db.run('BEGIN TRANSACTION');
        // Remove existing subscriptions for the user
        yield db.run('DELETE FROM subscriptions WHERE userId = ?', [userId]);
        // Add new subscriptions for each combination of states and topics
        for (const state of states) {
            for (const topic of topics) {
                yield db.run('INSERT INTO subscriptions (userId, state, topic) VALUES (?, ?, ?)', [
                    userId,
                    state,
                    topic,
                ]);
            }
        }
        // Commit the transaction
        yield db.run('COMMIT');
        console.log(`User ${userId} subscribed to states: ${states}, topics: ${topics}`);
    }
    catch (error) {
        // Rollback in case of error
        yield db.run('ROLLBACK');
        console.error(`Error subscribing user ${userId}:`, error);
        throw error;
    }
    finally {
        db.close();
    }
});
exports.subscribeUser = subscribeUser;
// Get all subscriptions (optional, for debugging or admin purposes)
const getAllSubscriptions = () => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        const rows = yield db.all('SELECT userId, state, topic FROM subscriptions');
        const subscriptions = {};
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
    }
    catch (error) {
        console.error('Error fetching all subscriptions:', error);
        throw error;
    }
    finally {
        db.close();
    }
});
exports.getAllSubscriptions = getAllSubscriptions;
