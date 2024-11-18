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
exports.getDistinctTopics = exports.getDistinctStates = exports.getUserByUsername = exports.createUser = void 0;
const sqlite_1 = require("../db/sqlite");
const createUser = (username, password, topics, states) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        // Start a transaction to ensure both user creation and subscription insertion succeed together
        yield db.run('BEGIN TRANSACTION');
        // Insert user into the users table
        const result = yield db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        const userId = result.lastID; // Retrieve the newly created user's ID
        // Insert initial subscriptions into the subscription table
        for (const state of states) {
            for (const topic of topics) {
                yield db.run('INSERT INTO subscriptions (userId, state, topic) VALUES (?, ?, ?)', [userId, state, topic]);
            }
        }
        // Commit the transaction
        yield db.run('COMMIT');
        console.log('User created and subscriptions added successfully');
    }
    catch (error) {
        // Rollback in case of failure
        yield db.run('ROLLBACK');
        console.error('Error creating user or adding subscriptions:', error);
        throw error;
    }
    finally {
        db.close();
    }
});
exports.createUser = createUser;
const getUserByUsername = (username) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    const query = 'SELECT * FROM users WHERE username = ?';
    const user = yield db.get(query, [username]);
    return user || null;
});
exports.getUserByUsername = getUserByUsername;
// Function to fetch distinct states from the user table
const getDistinctStates = () => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        const rows = yield db.all(`SELECT DISTINCT state FROM users WHERE state IS NOT NULL`);
        return rows.map(row => row.state); // Extract states as an array
    }
    catch (error) {
        console.error('Error fetching distinct states:', error);
        throw new Error('Failed to fetch distinct states');
    }
    finally {
        yield db.close();
    }
});
exports.getDistinctStates = getDistinctStates;
// Function to fetch distinct topics from the user table
const getDistinctTopics = () => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.getDbConnection)();
    try {
        const rows = yield db.all(`SELECT DISTINCT topic FROM users WHERE topic IS NOT NULL`);
        return rows.map(row => row.topic); // Extract topics as an array
    }
    catch (error) {
        console.error('Error fetching distinct topics:', error);
        throw new Error('Failed to fetch distinct topics');
    }
    finally {
        yield db.close();
    }
});
exports.getDistinctTopics = getDistinctTopics;
