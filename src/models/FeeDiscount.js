import mongoose from 'mongoose';

const feeDiscountSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'studentModel'
  },
  studentModel: {
    type: String,
    required: true,
    enum: ['StudentBAS', 'StudentBSc', 'StudentBEd']
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true
  },
  discountId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  discountType: {
    type: String,
    required: true,
    enum: ['Scholarship', 'Sibling', 'Merit', 'Financial Aid', 'Other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique discount per student per session
feeDiscountSchema.index({ studentId: 1, sessionId: 1, discountType: 1 }, { unique: true });

const FeeDiscount = mongoose.model('FeeDiscount', feeDiscountSchema);

export default FeeDiscount;
