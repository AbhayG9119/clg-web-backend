import Designation from '../models/Designation.js';

// Get all designations
export const getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find().sort({ name: 1 });
    res.json(designations);
  } catch (error) {
    console.error('Error fetching designations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new designation
export const addDesignation = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Designation name is required' });
  }

  try {
    const existingDesignation = await Designation.findOne({ name: name.trim() });
    if (existingDesignation) {
      return res.status(400).json({ message: 'Designation already exists' });
    }

    const designation = new Designation({ name: name.trim() });
    await designation.save();

    res.status(201).json(designation);
  } catch (error) {
    console.error('Error adding designation:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Designation already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};
