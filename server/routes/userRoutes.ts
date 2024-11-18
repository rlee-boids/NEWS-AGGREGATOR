import express from 'express';
import { registerUser, loginUser } from '../controllers/userController';

const router = express.Router();

//POST /register - register a new user
router.post('/register', registerUser);
//POST /login - login
router.post('/login', loginUser);

export default router;