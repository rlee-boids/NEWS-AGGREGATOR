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
exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const userModel_1 = require("../models/userModel");
// Register a new user
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, states, topics } = req.body;
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    if (!username || !password || !(states === null || states === void 0 ? void 0 : states.length) || !(topics === null || topics === void 0 ? void 0 : topics.length)) {
        return res.status(400).json({ error: 'Username, password, states, and topics are required' });
    }
    try {
        yield (0, userModel_1.createUser)(username, hashedPassword, topics, states);
        res.status(201).json({ success: true, message: 'User registered successfully!' });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
exports.registerUser = registerUser;
// User login
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield (0, userModel_1.getUserByUsername)(username);
    if (user && (yield bcrypt_1.default.compare(password, user.password))) {
        // Generate and return a session token or JWT (for demonstration purposes only)
        res.json({ message: 'Login successful', user });
    }
    else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});
exports.loginUser = loginUser;
