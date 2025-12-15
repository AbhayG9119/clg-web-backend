import mongoose from 'mongoose';

const concessionSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true,
    enum: ['B.A', 'B.Sc', 'B.Ed']
  },
  concessionType: {
    type: String,
    required: true,
    enum: ['scholarship', 'financial-aid', 'merit-based', 'sports', 'cultural', 'other']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  isPercentage: {
    type: Boolean,
    default: false
  },
  academicYear: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  approvedBy: {
    type: String,
    required: true
  },
  approvalDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  documents: [{
    type: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
concessionSchema.index({ studentId: 1, academicYear: 1, semester: 1 });
concessionSchema.index({ course: 1, status: 1 });

const Concession = mongoose.model('Concession', concessionSchema);

export default Concession;
