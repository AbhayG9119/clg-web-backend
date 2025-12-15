import express from 'express';
import {
  addExpense,
  getExpenses,
  getExpenseReport,
  updateExpense,
  deleteExpense,
  upload
} from '../controllers/expenseController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All expense routes require authentication and admin access
router.use(protect);
router.use(adminOnly);

// Routes for expense management
router.post('/', upload.single('attachment'), addExpense);
router.get('/', getExpenses);
router.get('/report', getExpenseReport);
router.put('/:id', upload.single('attachment'), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
