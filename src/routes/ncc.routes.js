import express from 'express';
import { submitNCCQuery, getNCCQueries } from '../controllers/nccController.js';

const router = express.Router();

// Submit NCC Query
router.post('/', submitNCCQuery);

// Get all NCC Queries
router.get('/', getNCCQueries);

export default router;
