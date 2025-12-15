import mongoose from 'mongoose';

const markSheetSchema = new mongoose.Schema({
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
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  subjects: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    subjectName: {
      type: String,
      required: true
    },
    subjectCode: {
      type: String,
      required: true
    },
    credits: {
      type: Number,
      required: true
    },
    internalMarks: {
      type: Number,
      min: 0,
      max: 50,
      default: 0
    },
    externalMarks: {
      type: Number,
      min: 0,
      max: 50,
      default: 0
    },
    totalMarks: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'I'],
      default: 'I' // I for Incomplete
    },
    status: {
      type: String,
      enum: ['Pass', 'Fail', 'Incomplete'],
      default: 'Incomplete'
    }
  }],
  totalCredits: {
    type: Number,
    default: 0
  },
  earnedCredits: {
    type: Number,
    default: 0
  },
  sgpa: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  overallStatus: {
    type: String,
    enum: ['Pass', 'Fail', 'Incomplete', 'Promoted'],
    default: 'Incomplete'
  },
  remarks: {
    type: String,
    trim: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isFinal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate total and earned credits before saving
markSheetSchema.pre('save', function(next) {
  this.totalCredits = this.subjects.reduce((sum, subject) => sum + subject.credits, 0);
  this.earnedCredits = this.subjects
    .filter(subject => subject.status === 'Pass')
    .reduce((sum, subject) => sum + subject.credits, 0);
  next();
});

// Index for efficient queries
markSheetSchema.index({ studentId: 1, year: 1, semester: 1 });
markSheetSchema.index({ sessionId: 1 });

const MarkSheet = mongoose.model('MarkSheet', markSheetSchema);

export default MarkSheet;
