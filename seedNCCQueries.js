import mongoose from 'mongoose';
import NCCQuery from './src/models/NCCQuery.js';
import dotenv from 'dotenv';

dotenv.config({ path: './Backend/.env' });

const seedNCCQueries = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing NCC queries
    await NCCQuery.deleteMany({});
    console.log('Cleared existing NCC queries');

    // Sample NCC query data
    const nccQueries = [
      {
        studentName: 'Rajesh Kumar',
        email: 'rajesh.kumar@email.com',
        phone: '9876543220',
        course: 'B.Sc Physics',
        year: '2nd Year',
        nccExperience: '1 year in school NCC',
        reason: 'I want to join NCC to develop leadership skills and participate in national camps.',
        status: 'pending',
        createdAt: new Date('2024-01-25')
      },
      {
        studentName: 'Sunita Devi',
        email: 'sunita.devi@email.com',
        phone: '9876543221',
        course: 'B.A English',
        year: '1st Year',
        nccExperience: 'No prior experience',
        reason: 'Interested in adventure activities and want to serve the nation through NCC.',
        status: 'under_review',
        createdAt: new Date('2024-01-26')
      },
      {
        studentName: 'Manoj Singh',
        email: 'manoj.singh@email.com',
        phone: '9876543222',
        course: 'B.Tech Mechanical',
        year: '3rd Year',
        nccExperience: '2 years in school NCC, participated in state level camp',
        reason: 'Want to continue NCC training and aim for officer cadre selection.',
        status: 'approved',
        createdAt: new Date('2024-01-27')
      },
      {
        studentName: 'Priyanka Sharma',
        email: 'priyanka.sharma@email.com',
        phone: '9876543223',
        course: 'B.Com',
        year: '2nd Year',
        nccExperience: '6 months basic training',
        reason: 'Looking to improve discipline and participate in cultural activities.',
        status: 'pending',
        createdAt: new Date('2024-01-28')
      },
      {
        studentName: 'Amit Patel',
        email: 'amit.patel@email.com',
        phone: '9876543224',
        course: 'BCA',
        year: '1st Year',
        nccExperience: 'No experience',
        reason: 'Want to develop personality and leadership qualities through NCC training.',
        status: 'pending',
        createdAt: new Date('2024-01-29')
      }
    ];

    // Insert sample NCC queries
    await NCCQuery.insertMany(nccQueries);
    console.log('Sample NCC queries inserted successfully');

    console.log('NCC query seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding NCC queries:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

seedNCCQueries();
