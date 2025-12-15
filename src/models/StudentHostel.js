import mongoose from 'mongoose';

const studentHostelSchema = new mongoose.Schema({
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
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelFee',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true
  },
  roomNumber: {
    type: String,
    trim: true
  },
  feeAmount: {
    type: Number,
    required: true,
    min: 0
  },
  feeType: {
    type: String,
    required: true,
    enum: ['Monthly', 'Yearly']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique student per session
studentHostelSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

const StudentHostel = mongoose.model('StudentHostel', studentHostelSchema);

export default StudentHostel;
