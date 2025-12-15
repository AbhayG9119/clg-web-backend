import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Office Supplies', 'Travel', 'Utilities', 'Maintenance', 'Other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  notes: {
    type: String,
    trim: true
  },
  attachment: {
    type: String, // File path for uploaded attachment
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
expenseSchema.index({ createdBy: 1, date: -1 });
expenseSchema.index({ session: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
