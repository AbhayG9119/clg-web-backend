import mongoose from 'mongoose';

const academicReportSchema = new mongoose.Schema({
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
  reportType: {
    type: String,
    required: true,
    enum: ['Progress Report', 'Semester Report', 'Annual Report', 'Final Report']
  },
  period: {
    fromDate: {
      type: Date,
      required: true
    },
    toDate: {
      type: Date,
      required: true
    },
    academicYear: {
      type: String,
      required: true // e.g., "2023-24"
    },
    semester: {
      type: Number,
      min: 1,
      max: 2
    },
    year: {
      type: Number,
      min: 1,
      max: 3
    }
  },
  academicPerformance: {
    currentYear: {
      type: Number,
      required: true
    },
    currentSemester: {
      type: Number,
      required: true
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    sgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    totalCreditsEarned: {
      type: Number,
      default: 0
    },
    totalCreditsRequired: {
      type: Number,
      default: 0
    },
    subjectsCompleted: {
      type: Number,
      default: 0
    },
    subjectsPending: {
      type: Number,
      default: 0
    }
  },
  attendance: {
    totalClasses: {
      type: Number,
      default: 0
    },
    classesAttended: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    attendanceGrade: {
      type: String,
      enum: ['Excellent', 'Good', 'Satisfactory', 'Poor'],
      default: 'Satisfactory'
    }
  },
  coCurricularActivities: [{
    activity: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Sports', 'Cultural', 'NCC', 'NSS', 'Other'],
      required: true
    },
    achievement: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      required: true
    }
  }],
  disciplinaryRecord: [{
    type: {
      type: String,
      enum: ['Warning', 'Suspension', 'Fine', 'Positive Note'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    actionTaken: {
      type: String,
      trim: true
    }
  }],
  recommendations: {
    academicAdvisor: {
      type: String,
      trim: true
    },
    hodRemarks: {
      type: String,
      trim: true
    },
    principalRemarks: {
      type: String,
      trim: true
    }
  },
  nextSteps: [{
    recommendation: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    deadline: {
      type: Date
    }
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Reviewed', 'Approved'],
    default: 'Draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate attendance percentage before saving
academicReportSchema.pre('save', function(next) {
  if (this.attendance.totalClasses > 0) {
    this.attendance.attendancePercentage =
      (this.attendance.classesAttended / this.attendance.totalClasses) * 100;
  }
  next();
});

// Index for efficient queries
academicReportSchema.index({ studentId: 1, reportType: 1 });
academicReportSchema.index({ sessionId: 1 });
academicReportSchema.index({ 'period.academicYear': 1 });

const AcademicReport = mongoose.model('AcademicReport', academicReportSchema);

export default AcademicReport;
