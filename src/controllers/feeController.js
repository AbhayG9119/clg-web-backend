import FeeStructure from '../models/FeeStructure.js';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';

// Initialize default fee structures
const initializeDefaultFeeStructures = async () => {
  const defaultFees = [
    {
      course: 'B.A',
      feeComponents: {
        tuitionFee: 20000,
        libraryFee: 2000,
        laboratoryFee: 0,
        examinationFee: 3000,
        sportsFee: 1000,
        developmentFee: 1500,
        miscellaneousFee: 1000
      },
      totalFee: 28500
    },
    {
      course: 'B.Sc',
      feeComponents: {
        tuitionFee: 25000,
        libraryFee: 2000,
        laboratoryFee: 5000,
        examinationFee: 3500,
        sportsFee: 1200,
        developmentFee: 2000,
        miscellaneousFee: 1000
      },
      totalFee: 39700
    },
    {
      course: 'B.Ed',
      feeComponents: {
        tuitionFee: 30000,
        libraryFee: 2500,
        laboratoryFee: 3000,
        examinationFee: 4000,
        sportsFee: 1500,
        developmentFee: 2500,
        miscellaneousFee: 1500
      },
      totalFee: 45500
    }
  ];

  for (const fee of defaultFees) {
    await FeeStructure.findOneAndUpdate(
      { course: fee.course },
      fee,
      { upsert: true, new: true }
    );
  }
};

// Get all fee structures
export const getFeeStructures = async (req, res) => {
  try {
    await initializeDefaultFeeStructures();
    const feeStructures = await FeeStructure.find();
    res.status(200).json(feeStructures);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fee structures', error: error.message });
  }
};

// Get fee structure by course
export const getFeeStructureByCourse = async (req, res) => {
  try {
    await initializeDefaultFeeStructures();
    const { course } = req.params;

    // If user is student, check if they can access this course
    if (req.user.role === 'student') {
      // Find student record to get their course
      let student = await StudentBAS.findById(req.user.id);
      if (!student) {
        student = await StudentBSc.findById(req.user.id);
      }
      if (!student) {
        student = await StudentBEd.findById(req.user.id);
      }

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Check if the requested course matches student's course
      if (student.department !== course) {
        return res.status(403).json({ message: 'Access denied. You can only view your own course fee structure.' });
      }
    }

    const feeStructure = await FeeStructure.findOne({ course });
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }
    res.status(200).json(feeStructure);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fee structure', error: error.message });
  }
};

// Create or update fee structure
export const createOrUpdateFeeStructure = async (req, res) => {
  try {
    const { course, feeComponents } = req.body;

    const feeStructure = await FeeStructure.findOneAndUpdate(
      { course },
      { feeComponents },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(feeStructure);
  } catch (error) {
    res.status(500).json({ message: 'Error creating/updating fee structure', error: error.message });
  }
};

// Delete fee structure
export const deleteFeeStructure = async (req, res) => {
  try {
    const { course } = req.params;
    const feeStructure = await FeeStructure.findOneAndDelete({ course });
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }
    res.status(200).json({ message: 'Fee structure deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fee structure', error: error.message });
  }
};

// Initialize default fee structures
export const initializeFeeStructures = async (req, res) => {
  try {
    const defaultFees = [
      {
        course: 'B.A',
        feeComponents: {
          tuitionFee: 20000,
          libraryFee: 2000,
          laboratoryFee: 0,
          examinationFee: 3000,
          sportsFee: 1000,
          developmentFee: 1500,
          miscellaneousFee: 1000
        },
        totalFee: 28500
      },
      {
        course: 'B.Sc',
        feeComponents: {
          tuitionFee: 25000,
          libraryFee: 2000,
          laboratoryFee: 5000,
          examinationFee: 3500,
          sportsFee: 1200,
          developmentFee: 2000,
          miscellaneousFee: 1000
        },
        totalFee: 39700
      },
      {
        course: 'B.Ed',
        feeComponents: {
          tuitionFee: 30000,
          libraryFee: 2500,
          laboratoryFee: 3000,
          examinationFee: 4000,
          sportsFee: 1500,
          developmentFee: 2500,
          miscellaneousFee: 1500
        },
        totalFee: 45000
      }
    ];

    for (const fee of defaultFees) {
      await FeeStructure.findOneAndUpdate(
        { course: fee.course },
        fee,
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ message: 'Fee structures initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing fee structures', error: error.message });
  }
};
