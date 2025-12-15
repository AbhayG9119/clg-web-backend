import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['B.A', 'B.Sc', 'B.Ed']
  },
  courseDuration: {
    type: Number,
    required: true // in years
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const academicSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['B.A', 'B.Sc', 'B.Ed']
  },
  batches: [batchSchema]
}, {
  timestamps: true
});

// Ensure only one active session at a time
academicSessionSchema.pre('save', async function(next) {
  if (this.isActive) {
    await mongoose.model('AcademicSession').updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);

export default AcademicSession;
