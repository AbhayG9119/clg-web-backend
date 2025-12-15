import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  period: {
    type: Number,
    min: 1,
    max: 8,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true // e.g., "09:00-10:00"
  },
  room: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
