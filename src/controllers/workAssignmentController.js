import WorkAssignment from '../models/WorkAssignment.js';
import studentModel from '../models/studentModel.js';

// Create a new assignment
const createAssignment = async (req, res) => {
  try {
    const { class: className, subject, title, description, dueDate } = req.body;
    const staffId = req.user.id;

    const assignment = new WorkAssignment({
      staffId,
      class: className,
      subject,
      title,
      description,
      dueDate: new Date(dueDate)
    });

    await assignment.save();
    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get staff's assignments
const getAssignments = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { class: className, subject } = req.query;

    let query = { staffId };
    if (className) query.class = className;
    if (subject) query.subject = subject;

    const assignments = await WorkAssignment.find(query)
      .populate('staffId', 'name')
      .sort({ dueDate: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get submissions for an assignment
const getSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await WorkAssignment.findById(id)
      .populate('submissions.studentId', 'name rollNo')
      .populate('staffId', 'name');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ assignment, submissions: assignment.submissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update submission (e.g., grade it)
const updateSubmission = async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { studentId, grade } = req.body;
    const staffId = req.user.id;

    const assignment = await WorkAssignment.findOne({ _id: assignmentId, staffId });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions.id(studentId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = grade;
    await assignment.save();

    res.json({ message: 'Grade updated', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createAssignment, getAssignments, getSubmissions, updateSubmission };
