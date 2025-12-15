import mongoose from 'mongoose';

const feePaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true
  },
  studentId: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true,
    enum: ['B.A', 'B.Sc', 'B.Ed']
  },
  year: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    required: true,
    enum: ['semester', 'year']
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  paymentDate: {
    type: Date
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  remarks: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Auto-generate paymentId
feePaymentSchema.pre('save', function(next) {
  if (this.isNew && !this.paymentId) {
    this.paymentId = `PAY${Date.now()}`;
  }
  next();
});

// Index for efficient queries
feePaymentSchema.index({ studentId: 1, paymentDate: -1 });

const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

export default FeePayment;
