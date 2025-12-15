import mongoose from 'mongoose';
import Circular from './src/models/Circular.js';
import dotenv from 'dotenv';

dotenv.config();

const checkCirculars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/clg-web');
    console.log('Connected to MongoDB');

    const circulars = await Circular.find({});
    console.log('All Circulars:', circulars);

    const staffCirculars = await Circular.find({
      audience_type: { $in: ['staff', 'all'] }
    });
    console.log('Staff Circulars:', staffCirculars);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkCirculars();
