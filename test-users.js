import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import { getUsers } from './src/controllers/userController.js';

dotenv.config();

const testGetUsers = async () => {
  try {
    await connectDB();
    console.log('DB connected');

    // Mock request and response
    const mockReq = {
      query: {}
    };
    const mockRes = {
      json: (data) => {
        console.log('Users count:', data.length);
        console.log('Sample users:', data.slice(0, 3));
        process.exit(0);
      },
      status: (code) => ({
        json: (msg) => {
          console.error('Error:', code, msg);
          process.exit(1);
        }
      })
    };

    await getUsers(mockReq, mockRes);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

testGetUsers();
