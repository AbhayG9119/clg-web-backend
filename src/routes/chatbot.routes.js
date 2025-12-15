import express from 'express';
import { getChatbotResponse } from '../controllers/chatbotController.js';

const router = express.Router();

// @route   POST /api/chatbot
// @desc    Get chatbot response
// @access  Public
router.post('/', getChatbotResponse);

export default router;
