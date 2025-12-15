import mongoose from 'mongoose';

const circularSchema = new mongoose.Schema({
  notice_id: {
    type: Number,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  audience_type: {
    type: String,
    enum: ['student', 'staff', 'all'],
    required: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  session_id: {
    type: String,
    required: false
  },
  is_published: {
    type: Boolean,
    default: false
  }
});

const Circular = mongoose.model('Circular', circularSchema);

export default Circular;
