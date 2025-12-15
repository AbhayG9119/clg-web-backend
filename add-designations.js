import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import { addDesignation } from './src/controllers/designationController.js';

dotenv.config();

const designations = [
  'Dean (Academic/Administration/Student Welfare)',
  'Head of Department (HOD)',
  'Faculty / Lecturer / Professor',
  'Registrar',
  'Admission Officer',
  'Examination Controller',
  'Fees Administrator',
  'Accountant'
];

const addDesignations = async () => {
  try {
    await connectDB();
    console.log('DB connected');

    for (const name of designations) {
      try {
        // Mock request and response for addDesignation
        const mockReq = { body: { name } };
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              if (code === 201) {
                console.log(`Added designation: ${name}`);
              } else {
                console.log(`Failed to add ${name}: ${data.message}`);
              }
            }
          })
        };
        await addDesignation(mockReq, mockRes);
      } catch (error) {
        console.log(`Error adding ${name}: ${error.message}`);
      }
    }

    console.log('All designations processed');
    process.exit(0);
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
};

addDesignations();
