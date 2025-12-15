import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeePayment',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  studentName: {
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
  paymentMethod: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  feeBreakdown: {
    tuitionFee: Number,
    libraryFee: Number,
    laboratoryFee: Number,
    examinationFee: Number,
    sportsFee: Number,
    developmentFee: Number,
    miscellaneousFee: Number,
    concessions: Number,
    totalFee: Number
  },
  issuedBy: {
    type: String,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  pdfPath: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  originalReceiptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receipt',
    default: null
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    default: null
  }
}, {
  timestamps: true
});

// Auto-generate receipt number
receiptSchema.pre('save', function(next) {
  if (this.isNew && !this.receiptNumber) {
    this.receiptNumber = `RCP${Date.now()}`;
  }
  next();
});

// Index for efficient queries
receiptSchema.index({ studentId: 1, paymentDate: -1 });
receiptSchema.index({ course: 1, year: 1, semester: 1 });

const Receipt = mongoose.model('Receipt', receiptSchema);

export default Receipt;
