import Leave from '../models/Leave.js';

// Apply for leave
const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const staffId = req.user.id;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const leave = new Leave({
      staffId,
      type,
      startDate: start,
      endDate: end,
      reason,
      days
    });

    await leave.save();
    res.status(201).json({ message: 'Leave application submitted', leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get staff's leave requests
const getMyLeaves = async (req, res) => {
  try {
    const staffId = req.user.id;
    const leaves = await Leave.find({ staffId })
      .populate('staffId', 'name designation')
      .populate('approverId', 'name')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update leave status (for approvers, but accessible via admin; staff can view)
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const approverId = req.user.id; // Assuming admin or higher

    const leave = await Leave.findById(id).populate('staffId', 'name');
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave is already processed' });
    }

    leave.status = status;
    leave.approverId = approverId;
    await leave.save();

    res.json({ message: `Leave ${status}`, leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { applyLeave, getMyLeaves, updateLeaveStatus };
