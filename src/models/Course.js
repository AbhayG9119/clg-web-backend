import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['core', 'elective', 'practical'],
    required: true
  }
});

const semesterSchema = new mongoose.Schema({
  semesterNumber: {
    type: Number,
    required: true
  },
  subjects: [subjectSchema]
});

const courseSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    enum: ['B.Sc', 'B.A', 'B.Ed']
  },
  courseName: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  totalSemesters: {
    type: Number,
    required: true
  },
  semesters: [semesterSchema]
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
