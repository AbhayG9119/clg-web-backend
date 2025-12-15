import mongoose from 'mongoose';

const transferCertificateSchema = new mongoose.Schema({
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
  tcNumber: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reasonForLeaving: {
    type: String,
    required: true,
    enum: [
      'Course Completed',
      'Transfer to Another Institution',
      'Personal Reasons',
      'Academic Reasons',
      'Disciplinary Action',
      'Other'
    ]
  },
  academicDetails: {
    admissionDate: {
      type: Date,
      required: true
    },
    lastDateOfAttendance: {
      type: Date,
      required: true
    },
    courseCompleted: {
      type: Boolean,
      required: true,
      default: false
    },
    finalYear: {
      type: Number,
      min: 1,
      max: 3
    },
    finalSemester: {
      type: Number,
      min: 1,
      max: 2
    },
    overallGrade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  conductAndCharacter: {
    conduct: {
      type: String,
      enum: ['Excellent', 'Good', 'Satisfactory', 'Poor'],
      default: 'Good'
    },
    disciplinaryActions: [{
      type: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        required: true
      },
      details: {
        type: String,
        required: true
      }
    }],
    remarks: {
      type: String,
      trim: true
    }
  },
  feeDetails: {
    duesCleared: {
      type: Boolean,
      required: true,
      default: false
    },
    outstandingAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    libraryBooksReturned: {
      type: Boolean,
      required: true,
      default: true
    },
    laboratoryEquipmentReturned: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Issued', 'Cancelled'],
    default: 'Draft'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-generate TC number before saving
transferCertificateSchema.pre('save', async function(next) {
  if (this.isNew && !this.tcNumber) {
    try {
      const count = await mongoose.model('TransferCertificate').countDocuments();
      const year = new Date().getFullYear();
      this.tcNumber = `TC${year}${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Index for efficient queries
transferCertificateSchema.index({ studentId: 1 });
transferCertificateSchema.index({ sessionId: 1 });

const TransferCertificate = mongoose.model('TransferCertificate', transferCertificateSchema);

export default TransferCertificate;
