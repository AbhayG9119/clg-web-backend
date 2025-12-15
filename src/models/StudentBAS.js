import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const studentSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'student'
  },

  // Academic Details
  rollNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['B.A', 'B.Sc', 'B.Ed']
  },
  year: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    trim: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true
  },
  batchId: {
    type: String,
    required: true
  },
  admissionYear: {
    type: Number,
    required: true
  },

  // Personal Details
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  guardianName: {
    type: String,
    required: true,
    trim: true
  },
  guardianContact: {
    type: String,
    required: true,
    trim: true
  },

  // Security
  securityQuestion: {
    type: String,
    required: true
  },
  securityAnswer: {
    type: String,
    required: true
  },

  // Uploads
  profilePhoto: {
    type: String, // File path
    trim: true
  },
  idProof: {
    type: String, // File path
    trim: true
  },
  documents: [{
    type: {
      type: String,
      required: true,
      enum: [
        '10th (High School) Marksheet',
        '12th (Intermediate) Marksheet',
        'Transfer Certificate (TC) from last institute',
        'Character Certificate',
        'Caste Certificate',
        'Domicile Certificate',
        'Recent passport size photographs',
        'Aadhaar Card or any valid Identity Proof'
      ]
    },
    status: {
      type: String,
      enum: ['Uploaded', 'Verified', 'Pending'],
      default: 'Pending'
    },
    filePath: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isMobileVerified: {
    type: Boolean,
    default: true
  },
  emailOTP: {
    type: String,
    trim: true
  },
  mobileOTP: {
    type: String,
    trim: true
  },
  otpExpiry: {
    type: Date
  },

// Auto-generated
  studentId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const StudentBAS = mongoose.model('StudentBAS', studentSchema);

export default StudentBAS;
