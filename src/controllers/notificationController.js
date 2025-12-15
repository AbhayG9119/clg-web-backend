import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import AcademicSession from '../models/AcademicSession.js';
import Student from '../models/studentModel.js';
import Faculty from '../models/Faculty.js';
import Admin from '../models/Admin.js';

// Send notification
export const sendNotification = async (req, res) => {
  try {
    const { recipientId, recipientRole, type, title, message, priority, relatedEntity, course, academicYear, semester, metadata } = req.body;

    const notification = new Notification({
      recipientId,
      recipientRole,
      type,
      title,
      message,
      priority,
      relatedEntity,
      course,
      academicYear,
      semester,
      metadata
    });

    await notification.save();

    // Log audit
    await AuditLog.create({
      action: 'notification_sent',
      entityType: 'notification',
      entityId: notification._id,
      userId: req.user.id,
      userRole: req.user.role,
      details: { type, recipientId },
      newValues: notification.toObject(),
      course,
      academicYear,
      semester
    });

    res.status(201).json({
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
};

// Get my notifications (for authenticated user)
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({
      recipientId: userId,
      expiresAt: { $gt: new Date() }
    }).sort({ sentAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Get notifications for a specific user (admin view)
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ recipientId: userId }).sort({ sentAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Get all notifications (admin view)
export const getAllNotifications = async (req, res) => {
  try {
    const { type, status, course, academicYear, semester } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (course) query.course = course;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const notifications = await Notification.find(query).sort({ sentAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { status: 'read', readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

// Send bulk notifications
export const sendBulkNotifications = async (req, res) => {
  try {
    const { recipientRole, type, title, message, priority, course, academicYear, semester } = req.body;

    let recipients = [];
    let query = {};

    if (recipientRole === 'student') {
      if (course) query.department = course;
      if (academicYear) query.year = academicYear;
      if (semester) query.semester = semester;
      recipients = await Student.find(query).select('_id');
    } else if (recipientRole === 'staff') {
      if (course) query.department = course;
      recipients = await Faculty.find(query).select('_id');
    } else if (recipientRole === 'faculty') {
      if (course) query.department = course;
      recipients = await Faculty.find(query).select('_id');
    } else if (recipientRole === 'admin') {
      recipients = await Admin.find(query).select('_id');
    } else {
      return res.status(400).json({ message: 'Invalid recipient role' });
    }

    const recipientIds = recipients.map(user => user._id.toString());

    if (recipientIds.length === 0) {
      return res.status(400).json({ message: 'No recipients found matching the criteria' });
    }

    const notifications = recipientIds.map(recipientId => ({
      recipientId,
      recipientRole,
      type,
      title,
      message,
      priority,
      course,
      academicYear,
      semester
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    // Log audit
    await AuditLog.create({
      action: 'bulk_notification_sent',
      entityType: 'notification',
      entityId: null,
      userId: req.user.id,
      userRole: req.user.role,
      details: { type, count: recipientIds.length },
      newValues: { recipientIds, type, title },
      course,
      academicYear,
      semester
    });

    res.status(201).json({
      message: `Bulk notifications sent to ${recipientIds.length} recipients`,
      count: createdNotifications.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending bulk notifications', error: error.message });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: { type: '$type', status: '$status' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification statistics', error: error.message });
  }
};

// Get notification filters (academic years and semesters)
export const getNotificationFilters = async (req, res) => {
  try {
    // Get distinct academic years from AcademicSession
    const sessions = await AcademicSession.find({}, 'sessionId').distinct('sessionId');
    const academicYears = sessions.map(sessionId => {
      // Parse sessionId like "2024-25-BA" to "2024-2025"
      const parts = sessionId.split('-');
      if (parts.length >= 2) {
        const startYear = parts[0];
        const endYear = '20' + parts[1];
        return `${startYear}-${endYear}`;
      }
      return sessionId;
    }).filter((value, index, self) => self.indexOf(value) === index); // unique

    // Semesters are standard 1-8
    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    res.status(200).json({
      academicYears,
      semesters
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification filters', error: error.message });
  }
};
