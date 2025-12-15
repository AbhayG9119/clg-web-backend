import Expense from '../models/Expense.js';
import AcademicSession from '../models/AcademicSession.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'expenses');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed'));
    }
  }
});

export const addExpense = async (req, res) => {
  try {
    const { category, amount, notes, date } = req.body;
    const createdBy = req.user.id;

    // Get current academic session
    const currentSession = await AcademicSession.findOne({ isActive: true });
    if (!currentSession) {
      return res.status(400).json({ message: 'No active academic session found' });
    }

    let attachment = null;
    if (req.file) {
      attachment = req.file.filename;
    }

    const expense = new Expense({
      category,
      amount: parseFloat(amount),
      notes,
      attachment,
      date: date ? new Date(date) : new Date(),
      createdBy,
      session: currentSession._id
    });

    await expense.save();

    res.status(201).json({
      message: 'Expense recorded successfully',
      expense
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Failed to record expense' });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, category } = req.query;
    const createdBy = req.user.id;

    let query = { createdBy };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query)
      .populate('createdBy', 'name email')
      .populate('session', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Expense.countDocuments(query);

    res.json({
      expenses,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
};

export const getExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const createdBy = req.user.id;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }

    const expenses = await Expense.find({
      createdBy,
      date: { $gte: start, $lte: end }
    });

    // Group by category and calculate totals
    const categoryTotals = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    const report = Object.keys(categoryTotals).map(category => ({
      category,
      total: categoryTotals[category]
    }));

    const grandTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({
      report,
      grand_total: grandTotal,
      startDate,
      endDate,
      totalExpenses: expenses.length
    });
  } catch (error) {
    console.error('Error generating expense report:', error);
    res.status(500).json({ message: 'Failed to generate expense report' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, notes, date } = req.body;
    const createdBy = req.user.id;

    const expense = await Expense.findOne({ _id: id, createdBy });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Handle file upload if new attachment provided
    if (req.file) {
      // Delete old attachment if exists
      if (expense.attachment) {
        const oldFilePath = path.join(process.cwd(), 'uploads', 'expenses', expense.attachment);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      expense.attachment = req.file.filename;
    }

    expense.category = category || expense.category;
    expense.amount = amount ? parseFloat(amount) : expense.amount;
    expense.notes = notes !== undefined ? notes : expense.notes;
    expense.date = date ? new Date(date) : expense.date;

    await expense.save();

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const createdBy = req.user.id;

    const expense = await Expense.findOneAndDelete({ _id: id, createdBy });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Delete attachment file if exists
    if (expense.attachment) {
      const filePath = path.join(process.cwd(), 'uploads', 'expenses', expense.attachment);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
};

export { upload };
