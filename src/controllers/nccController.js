import NCCQuery from '../models/NCCQuery.js';

// Submit NCC Query
export const submitNCCQuery = async (req, res) => {
  try {
    const { studentName, email, phone, course, year, nccExperience, reason } = req.body;

    const newQuery = new NCCQuery({
      studentName,
      email,
      phone,
      course,
      year,
      nccExperience,
      reason
    });

    await newQuery.save();

    res.status(201).json({ message: 'NCC query submitted successfully', query: newQuery });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all NCC Queries for admin
export const getNCCQueries = async (req, res) => {
  try {
    const queries = await NCCQuery.find().sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
