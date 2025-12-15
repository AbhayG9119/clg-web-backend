import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'studentModel',
    required: true
  },
  fileUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['submitted', 'pending', 'late', 'not-submitted'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: null
  },
  grade: {
    type: String,
    default: ''
  }
});

const workAssignmentSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  class: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  submissions: [submissionSchema]
}, {
  timestamps: true
});

const WorkAssignment = mongoose.model('WorkAssignment', workAssignmentSchema);
export default WorkAssignment;
