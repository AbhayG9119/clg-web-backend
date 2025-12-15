import mongoose from 'mongoose';

const studentTransportSchema = new mongoose.Schema({
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
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportRoute',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true
  },
  fare: {
    type: Number,
    required: true,
    min: 0
  },
  pickupPoint: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique student per session
studentTransportSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

const StudentTransport = mongoose.model('StudentTransport', studentTransportSchema);

export default StudentTransport;
