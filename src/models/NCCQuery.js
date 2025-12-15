import mongoose from 'mongoose';

const nccQuerySchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    trim: true
  },
  nccExperience: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const NCCQuery = mongoose.model('NCCQuery', nccQuerySchema);

export default NCCQuery;
