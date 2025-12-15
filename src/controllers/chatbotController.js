import express from 'express';

export const getChatbotResponse = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    // Basic echo response for now; can integrate AI later
    const answer = `You asked: "${message}". This is a placeholder response from the college chatbot.`;
    res.json({ answer });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
