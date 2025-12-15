import Timetable from '../models/Timetable.js';

// Get staff's timetable
const getTimetable = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { day } = req.query; // Optional filter by day

    let query = { staffId };
    if (day) {
      query.day = day;
    }

    const timetable = await Timetable.find(query)
      .sort({ period: 1 })
      .populate('staffId', 'name designation');

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update or add timetable entry (for admin, but accessible if needed)
const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const staffId = req.user.id; // Or admin

    const timetable = await Timetable.findByIdAndUpdate(id, updates, { new: true });
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    res.json({ message: 'Timetable updated', timetable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getTimetable, updateTimetable };
