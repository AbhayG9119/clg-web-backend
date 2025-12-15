import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import { getStudentPayments, getStudentDetails } from './src/controllers/paymentController.js';

dotenv.config();

const testPaymentEndpoints = async () => {
  try {
    await connectDB();
    console.log('DB connected');

    // Mock request for getStudentPayments (without auth for testing)
    const mockReqPayments = {
      params: { studentId: 'STU001' }, // Replace with actual studentId
      headers: {}, // No auth header for now
      user: { role: 'admin' } // Mock user for auth bypass
    };
    const mockResPayments = {
      json: (data) => {
        console.log('Student payments:', data);
      },
      status: (code) => ({
        json: (msg) => {
          console.error('Error fetching payments:', code, msg);
        }
      })
    };

    await getStudentPayments(mockReqPayments, mockResPayments);

    // Mock request for getStudentDetails (without auth for testing)
    const mockReqDetails = {
      params: { studentId: 'STU001' }, // Replace with actual studentId
      headers: {}, // No auth header for now
      user: { role: 'admin' } // Mock user for auth bypass
    };
    const mockResDetails = {
      json: (data) => {
        console.log('Student details:', data);
      },
      status: (code) => ({
        json: (msg) => {
          console.error('Error fetching details:', code, msg);
        }
      })
    };

    await getStudentDetails(mockReqDetails, mockResDetails);

    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

testPaymentEndpoints();
