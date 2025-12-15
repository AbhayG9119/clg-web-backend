import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import AcademicSession from '../models/AcademicSession.js';

// Helper function to get student model
const getStudentModel = (department) => {
  switch (department) {
    case 'B.A': return StudentBAS;
    case 'B.Sc': return StudentBSc;
    case 'B.Ed': return StudentBEd;
    default: return null;
  }
};

// Helper function to find student by ID
const findStudentById = async (id) => {
  let student = await StudentBAS.findById(id);
  if (student) return { student, model: StudentBAS, department: 'B.A' };

  student = await StudentBSc.findById(id);
  if (student) return { student, model: StudentBSc, department: 'B.Sc' };

  student = await StudentBEd.findById(id);
  if (student) return { student, model: StudentBEd, department: 'B.Ed' };

  return null;
};

// Get course duration based on department
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

// Promote students to next year/semester
export const promoteStudents = async (req, res) => {
  try {
    const { sessionId, targetYear, targetSemester } = req.body;

    // Find the session
    const session = await AcademicSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.isActive) {
      return res.status(400).json({ message: 'Session is not active' });
    }

    // Get all students from all departments
    const studentsBAS = await StudentBAS.find({ sessionId: session._id });
    const studentsBSc = await StudentBSc.find({ sessionId: session._id });
    const studentsBEd = await StudentBEd.find({ sessionId: session._id });

    const allStudents = [
      ...studentsBAS.map(s => ({ ...s.toObject(), department: 'B.A', model: StudentBAS })),
      ...studentsBSc.map(s => ({ ...s.toObject(), department: 'B.Sc', model: StudentBSc })),
      ...studentsBEd.map(s => ({ ...s.toObject(), department: 'B.Ed', model: StudentBEd }))
    ];

    const promotionResults = {
      promoted: [],
      graduated: [],
      failed: []
    };

    for (const student of allStudents) {
      try {
        const courseDuration = getCourseDuration(student.department);

        // Check if student can be promoted
        if (student.year >= courseDuration) {
          // Student has completed the course
          promotionResults.graduated.push({
            studentId: student.studentId,
            name: `${student.firstName} ${student.lastName}`,
            department: student.department,
            finalYear: student.year,
            finalSemester: student.semester
          });
          continue;
        }

        // Promote student
        const newYear = targetYear || student.year + 1;
        const newSemester = targetSemester || 1; // Reset to semester 1 for new year

        // Update student
        await student.model.findByIdAndUpdate(student._id, {
          year: newYear,
          semester: newSemester
        });

        promotionResults.promoted.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          department: student.department,
          fromYear: student.year,
          fromSemester: student.semester,
          toYear: newYear,
          toSemester: newSemester
        });

      } catch (error) {
        console.error(`Error promoting student ${student.studentId}:`, error);
        promotionResults.failed.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Promotion process completed',
      sessionId: session.sessionId,
      results: promotionResults,
      summary: {
        totalStudents: allStudents.length,
        promoted: promotionResults.promoted.length,
        graduated: promotionResults.graduated.length,
        failed: promotionResults.failed.length
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during promotion' });
  }
};

// Get promotion eligible students
export const getPromotionEligibleStudents = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AcademicSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get all students from all departments
    const studentsBAS = await StudentBAS.find({ sessionId: session._id });
    const studentsBSc = await StudentBSc.find({ sessionId: session._id });
    const studentsBEd = await StudentBEd.find({ sessionId: session._id });

    const allStudents = [
      ...studentsBAS.map(s => ({ ...s.toObject(), department: 'B.A', model: StudentBAS })),
      ...studentsBSc.map(s => ({ ...s.toObject(), department: 'B.Sc', model: StudentBSc })),
      ...studentsBEd.map(s => ({ ...s.toObject(), department: 'B.Ed', model: StudentBEd }))
    ];

    const eligibleStudents = [];
    const graduatedStudents = [];

    for (const student of allStudents) {
      const courseDuration = getCourseDuration(student.department);

      if (student.year >= courseDuration) {
        graduatedStudents.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          department: student.department,
          year: student.year,
          semester: student.semester,
          status: 'Graduated'
        });
      } else {
        eligibleStudents.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          department: student.department,
          currentYear: student.year,
          currentSemester: student.semester,
          courseDuration,
          canPromote: student.year < courseDuration
        });
      }
    }

    res.json({
      sessionId: session.sessionId,
      eligibleForPromotion: eligibleStudents,
      graduated: graduatedStudents,
      summary: {
        totalStudents: allStudents.length,
        eligible: eligibleStudents.length,
        graduated: graduatedStudents.length
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk update student academic details
export const bulkUpdateStudentAcademicDetails = async (req, res) => {
  try {
    const { sessionId, updates } = req.body;

    const session = await AcademicSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const results = {
      updated: [],
      failed: []
    };

    for (const update of updates) {
      try {
        const studentData = await findStudentById(update.studentId);
        if (!studentData) {
          results.failed.push({
            studentId: update.studentId,
            error: 'Student not found'
          });
          continue;
        }

        const updateData = {};
        if (update.year !== undefined) updateData.year = update.year;
        if (update.semester !== undefined) updateData.semester = update.semester;
        if (update.section !== undefined) updateData.section = update.section;

        await studentData.model.findByIdAndUpdate(studentData.student._id, updateData);

        results.updated.push({
          studentId: update.studentId,
          name: `${studentData.student.firstName} ${studentData.student.lastName}`,
          department: studentData.department,
          updates: updateData
        });

      } catch (error) {
        results.failed.push({
          studentId: update.studentId,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk update completed',
      results,
      summary: {
        total: updates.length,
        updated: results.updated.length,
        failed: results.failed.length
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
