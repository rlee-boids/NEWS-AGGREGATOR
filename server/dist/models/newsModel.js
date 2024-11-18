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
exports.getLatestNewsDate = exports.getTopics = exports.getStates = exports.addNewsToDB = exports.getNewsByIdFromDB = exports.getAllNews = void 0;
const sqlite_1 = require("../db/sqlite");
// Retrieve all news articles with optional filters
const getAllNews = (filters, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        const { states, topics, search } = filters;
        // Base query
        let query = `SELECT * FROM news WHERE 1=1`;
        // Add states filter
        if (states.length > 0) {
            const statePlaceholders = states.map(() => '?').join(', ');
            query += ` AND state IN (${statePlaceholders})`;
        }
        // Add topics filter using LIKE for partial matches
        if (topics.length > 0) {
            const topicConditions = topics.map(() => `topic LIKE ?`).join(' OR ');
            query += ` AND (${topicConditions})`;
        }
        // Add search filter
        if (search) {
            query += ` AND (title LIKE ? OR summary LIKE ?)`;
        }
        // Add pagination
        query += ` LIMIT ? OFFSET ?`;
        // Build query parameters
        const topicParams = topics.map(topic => `%${topic}%`); // Prepare topics for LIKE matching
        const params = [
            ...states,
            ...topicParams,
            ...(search ? [`%${search}%`, `%${search}%`] : []),
            limit,
            offset,
        ];
        //console.log('SQL Query:', query);
        //console.log('Parameters:', params);
        return yield db.all(query, params);
    }
    catch (error) {
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
    }
    finally {
        yield db.close();
    }
});
exports.getAllNews = getAllNews;
// Retrieve a specific news article by ID
const getNewsByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    return db.get('SELECT * FROM news WHERE id = ?', id);
});
exports.getNewsByIdFromDB = getNewsByIdFromDB;
// Add a new news article to the database
const addNewsToDB = (article) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    const { title, summary, state, topic, date, link } = article;
    const result = yield db.run('INSERT INTO news (title, summary, state, topic, date, link) VALUES (?, ?, ?, ?, ?, ?)', title, summary, state, topic, date, link);
    return Object.assign({ id: result.lastID }, article);
});
exports.addNewsToDB = addNewsToDB;
const getStates = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    console.log(userId);
    const query = 'SELECT states FROM users WHERE id = ? AND states IS NOT NULL';
    try {
        const rows = yield db.all(query, [userId]);
        // Parse JSON strings and flatten the results
        const states = rows
            .map((row) => JSON.parse(row.states)) // Parse JSON strings
            .flat(); // Flatten arrays into a single array
        return Array.from(new Set(states)); // Remove duplicates
    }
    catch (error) {
        console.error("Error fetching states for user:", error);
        throw error;
    }
    finally {
        db.close();
    }
});
exports.getStates = getStates;
const getTopics = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    const query = 'SELECT topics FROM users WHERE id = ? AND topics IS NOT NULL';
    try {
        const rows = yield db.all(query, [userId]);
        // Parse JSON strings and flatten the results
        const topics = rows
            .map((row) => JSON.parse(row.topics)) // Parse JSON strings
            .flat(); // Flatten arrays into a single array
        return Array.from(new Set(topics)); // Remove duplicates
    }
    catch (error) {
        console.error("Error fetching topics for user:", error);
        throw error;
    }
    finally {
        db.close();
    }
});
exports.getTopics = getTopics;
// Fetch the latest news date for a given state and topic
const getLatestNewsDate = (state, topic) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        const query = `
      SELECT MAX(date) AS latestDate
      FROM news
      WHERE state = ? AND topic LIKE ?`;
        const result = yield db.get(query, [state, `%${topic}%`]);
        return (result === null || result === void 0 ? void 0 : result.latestDate) || null;
    }
    catch (error) {
        console.error('Error fetching latest news date:', error);
        throw error;
    }
    finally {
        yield db.close();
    }
});
exports.getLatestNewsDate = getLatestNewsDate;
