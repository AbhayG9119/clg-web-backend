import AdmissionQuery from '../models/AdmissionQuery.js';
import AcademicSession from '../models/AcademicSession.js';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import Counter from '../models/Counter.js';

// Helper function to get student model
const getStudentModel = (department) => {
  switch (department) {
    case 'B.A': return StudentBAS;
    case 'B.Sc': return StudentBSc;
    case 'B.Ed': return StudentBEd;
    default: return null;
  }
};

// Helper function to get course duration
const getCourseDuration = (department) => {
  switch (department) {
    case 'B.A':
    case 'B.Sc':
      return 3; // 3 years
    case 'B.Ed':
      return 2; // 2 years
    default:
      return 3;
  }
};

// Submit Admission Query
export const submitAdmissionQuery = async (req, res) => {
  try {
    const { name, email, phone, location, pincode, course, message } = req.body;

    const newQuery = new AdmissionQuery({
      name,
      email,
      phone,
      location,
      pincode,
      course,
      message
    });

    await newQuery.save();

    res.status(201).json({ message: 'Admission query submitted successfully', query: newQuery });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all Admission Queries for admin
export const getAdmissionQueries = async (req, res) => {
  try {
    const queries = await AdmissionQuery.find().sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admit new student with enrollment validations
export const admitStudent = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      mobileNumber,
      tempPassword,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      guardianName,
      guardianContact,
      previousQualification,
      courseApplied,
      admissionCategory,
      documents,
      admissionFee,
      feeStatus,
      remarks
    } = req.body;

    // Get course duration
    const courseDuration = getCourseDuration(courseApplied);
    if (!courseDuration) {
      return res.status(400).json({ message: 'Invalid course selected' });
    }

    // Find active session
    const activeSession = await AcademicSession.findOne({ isActive: true });
    if (!activeSession) {
      return res.status(400).json({ message: 'No active academic session found' });
    }

    // Find appropriate batch for Year 1
    const firstYearBatch = activeSession.batches.find(
      batch => batch.year === 1 && batch.department === courseApplied
    );

    if (!firstYearBatch) {
      return res.status(400).json({
        message: `No batch available for Year 1 of ${courseApplied} in the current session`
      });
    }

    // Get student model
    const StudentModel = getStudentModel(courseApplied);
    if (!StudentModel) {
      return res.status(400).json({ message: 'Invalid course model' });
    }

    // Generate sequential roll number: course name + admission year + 3-digit serial (per course and year)
    // Use full 4-digit year from session id to ensure proper format
    const admissionYear = activeSession.sessionId.split('-')[0];
    const coursePrefix = courseApplied.replace('.', '');
    const rollNoCounter = await Counter.findOneAndUpdate(
      { name: `rollNo-${coursePrefix}-${admissionYear}` },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    const rollNo = `${coursePrefix}${admissionYear}${String(rollNoCounter.value).padStart(3, '0')}`;

    // Generate unique studentId
    const counter = await Counter.findOneAndUpdate(
      { name: 'studentId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    const studentId = `STU${String(counter.value).padStart(6, '0')}`;

    // Create student
    const student = new StudentModel({
      firstName,
      middleName,
      lastName,
      username: email,
      email,
      mobileNumber,
      password: tempPassword,
      rollNo,
      department: courseApplied,
      year: 1, // Always start from Year 1
      semester: 1, // Always start from Semester 1
      section: '',
      sessionId: activeSession._id,
      batchId: firstYearBatch.batchId,
      admissionYear,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      guardianName,
      guardianContact,
      documents: [
        {
          type: '10th (High School) Marksheet',
          status: documents.marksheet ? 'Uploaded' : 'Pending',
          filePath: documents.marksheet || ''
        },
        {
          type: 'Aadhaar Card or any valid Identity Proof',
          status: documents.idProof ? 'Uploaded' : 'Pending',
          filePath: documents.idProof || ''
        }
      ],
      profilePhoto: documents.photo || '',
      idProof: documents.idProof || '',
      studentId
    });

    await student.save();

    res.status(201).json({
      message: 'Student admitted successfully',
      admission: {
        studentId: student.studentId,
        rollNo: student.rollNo,
        tempPassword,
        course: courseApplied,
        year: 1,
        semester: 1,
        batchId: firstYearBatch.batchId,
        sessionId: activeSession.sessionId,
        courseDuration
      }
    });

  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Student with this email or roll number already exists' });
    } else {
      res.status(500).json({ message: 'Server error during admission' });
    }
  }
};
