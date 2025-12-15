import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  month: {
    type: String,
    required: true // e.g., "2024-10"
  },
  baseSalary: {
    type: Number,
    required: true
  },
  allowances: [{
    type: {
      type: String,
      required: true // e.g., "HRA", "DA"
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  deductions: [{
    type: {
      type: String,
      required: true // e.g., "PF", "Tax"
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  netSalary: {
    type: Number,
    required: true
  },
  payslipUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'generated', 'paid'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Payroll = mongoose.model('Payroll', payrollSchema);
export default Payroll;
