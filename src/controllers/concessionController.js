import Concession from '../models/Concession.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

// Create a new concession
export const createConcession = async (req, res) => {
  try {
    const { studentId, course, concessionType, title, description, amount, percentage, isPercentage, academicYear, semester, expiryDate, documents, remarks } = req.body;

    const concession = new Concession({
      studentId,
      course,
      concessionType,
      title,
      description,
      amount,
      percentage,
      isPercentage,
      academicYear,
      semester,
      expiryDate,
      documents,
      remarks,
      approvedBy: req.user.id
    });

    await concession.save();

    // Log audit
    await AuditLog.create({
      action: 'concession_applied',
      entityType: 'concession',
      entityId: concession._id,
      userId: req.user.id,
      userRole: req.user.role,
      details: { concessionType, amount, studentId },
      newValues: concession.toObject(),
      course,
      academicYear,
      semester
    });

    // Send notification to student
    await Notification.create({
      recipientId: studentId,
      recipientRole: 'student',
      type: 'concession_approved',
      title: 'Concession Approved',
      message: `Your ${title} concession of ₹${amount} has been approved.`,
      relatedEntity: { type: 'concession', id: concession._id },
      course,
      academicYear,
      semester
    });

    res.status(201).json({
      message: 'Concession created successfully',
      concession
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating concession', error: error.message });
  }
};

// Get concessions for a student
export const getStudentConcessions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const concessions = await Concession.find({ studentId }).sort({ createdAt: -1 });
    res.status(200).json(concessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching concessions', error: error.message });
  }
};

// Get my concessions (for authenticated student)
export const getMyConcessions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const concessions = await Concession.find({ studentId }).sort({ createdAt: -1 });
    res.status(200).json(concessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching concessions', error: error.message });
  }
};

// Get all concessions (admin view)
export const getAllConcessions = async (req, res) => {
  try {
    const { course, status, academicYear, semester } = req.query;
    let query = {};

    if (course) query.course = course;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const concessions = await Concession.find(query).sort({ createdAt: -1 });
    res.status(200).json(concessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching concessions', error: error.message });
  }
};

// Update concession
export const updateConcession = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const oldConcession = await Concession.findById(id);
    if (!oldConcession) {
      return res.status(404).json({ message: 'Concession not found' });
    }

    const concession = await Concession.findByIdAndUpdate(id, updateData, { new: true });

    // Log audit
    await AuditLog.create({
      action: 'concession_updated',
      entityType: 'concession',
      entityId: id,
      userId: req.user.id,
      userRole: req.user.role,
      details: { studentId: concession.studentId },
      oldValues: oldConcession.toObject(),
      newValues: concession.toObject(),
      course: concession.course,
      academicYear: concession.academicYear,
      semester: concession.semester
    });

    res.status(200).json({
      message: 'Concession updated successfully',
      concession
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating concession', error: error.message });
  }
};

// Delete concession
export const deleteConcession = async (req, res) => {
  try {
    const { id } = req.params;

    const concession = await Concession.findByIdAndDelete(id);
    if (!concession) {
      return res.status(404).json({ message: 'Concession not found' });
    }

    // Log audit
    await AuditLog.create({
      action: 'concession_removed',
      entityType: 'concession',
      entityId: id,
      userId: req.user.id,
      userRole: req.user.role,
      details: { studentId: concession.studentId },
      oldValues: concession.toObject(),
      course: concession.course,
      academicYear: concession.academicYear,
      semester: concession.semester
    });

    res.status(200).json({ message: 'Concession deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting concession', error: error.message });
  }
};

// Get concession statistics
export const getConcessionStats = async (req, res) => {
  try {
    const stats = await Concession.aggregate([
      {
        $group: {
          _id: { course: '$course', concessionType: '$concessionType' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.course',
          concessions: {
            $push: {
              type: '$_id.concessionType',
              count: '$count',
              totalAmount: '$totalAmount'
            }
          }
        }
      }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching concession statistics', error: error.message });
  }
};
