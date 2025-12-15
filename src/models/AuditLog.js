import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'fee_structure_created',
      'fee_structure_updated',
      'fee_structure_deleted',
      'payment_initiated',
      'payment_completed',
      'payment_failed',
      'payment_cancelled',
      'concession_applied',
      'concession_updated',
      'concession_removed',
      'receipt_generated',
      'receipt_cancelled',
      'reminder_sent',
      'bulk_operation'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['fee_structure', 'payment', 'concession', 'receipt', 'student']
  },
  entityId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['admin', 'staff', 'student']
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
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
  }
}, {
  timestamps: true
});

// Index for efficient queries
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ course: 1, academicYear: 1, semester: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
