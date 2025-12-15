import Circular from '../models/Circular.js';

// Get circulars for staff (audience_type: 'staff' or 'all')
export const getStaffCirculars = async (req, res) => {
  try {
    const circulars = await Circular.find({
      audience_type: { $in: ['staff', 'all'] }
    })

    .sort({ created_at: -1 });

    // Map to frontend expected format
    const formattedCirculars = circulars.map(circular => ({
      _id: circular._id,
      title: circular.title,
      description: circular.content, // Map content to description
      date: circular.created_at, // Map created_at to date
      fileUrl: null // Not implemented in model yet
    }));

    res.json(formattedCirculars);
  } catch (error) {
    console.error('Error fetching staff circulars:', error);
    res.status(500).json({ message: 'Error fetching circulars', error: error.message });
  }
};
