import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: String,
    required: true
  },
  recipientRole: {
    type: String,
    required: true,
    enum: ['admin', 'staff', 'faculty', 'student']
  },
  type: {
    type: String,
    required: true,
    enum: [
      'payment_reminder',
      'payment_overdue',
      'payment_successful',
      'fee_structure_updated',
      'concession_approved',
      'concession_rejected',
      'receipt_generated',
      'system_notification',
      'general',
      'academic',
      'exam'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  },
  deliveryMethods: [{
    method: {
      type: String,
      enum: ['email', 'sms', 'in_app'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    sentAt: {
      type: Date
    },
    errorMessage: {
      type: String,
      trim: true
    }
  }],
  relatedEntity: {
    type: {
      type: String,
      enum: ['payment', 'fee_structure', 'concession', 'receipt']
    },
    id: String
  },
  course: {
    type: String,
    enum: ['B.A', 'B.Sc', 'B.Ed']
  },
  academicYear: {
    type: Number
  },
  semester: {
    type: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ type: 1, sentAt: -1 });
notificationSchema.index({ 'deliveryMethods.status': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Auto-set expiration for certain notification types
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const expirationDays = {
      'payment_reminder': 30,
      'payment_overdue': 90,
      'payment_successful': 365,
      'fee_structure_updated': 30,
      'concession_approved': 365,
      'concession_rejected': 30,
      'receipt_generated': 365,
      'system_notification': 7,
      'general': 30,
      'academic': 30,
      'exam': 7
    };

    if (expirationDays[this.type]) {
      this.expiresAt = new Date(Date.now() + expirationDays[this.type] * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
