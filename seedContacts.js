import mongoose from 'mongoose';
import Contact from './src/models/Contact.js';
import dotenv from 'dotenv';

dotenv.config({ path: './Backend/.env' });

const seedContacts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing contacts
    await Contact.deleteMany({});
    console.log('Cleared existing contacts');

    // Sample contact data
    const contacts = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@email.com',
        phone: '9876543210',
        location: 'Delhi',
        subject: 'Course Information',
        message: 'I want to know about B.Tech Computer Science course details and admission process.',
        createdAt: new Date('2024-01-15')
      },
      {
        name: 'Priya Singh',
        email: 'priya.singh@email.com',
        phone: '9876543211',
        location: 'Mumbai',
        subject: 'Fee Structure',
        message: 'Please provide information about the fee structure for MBA program.',
        createdAt: new Date('2024-01-16')
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@email.com',
        phone: '9876543212',
        location: 'Bangalore',
        subject: 'Hostel Facilities',
        message: 'I need information about hostel accommodation and facilities available.',
        createdAt: new Date('2024-01-17')
      },
      {
        name: 'Sneha Patel',
        email: 'sneha.patel@email.com',
        phone: '9876543213',
        location: 'Ahmedabad',
        subject: 'Placement Details',
        message: 'Can you provide placement statistics and company details for the previous year?',
        createdAt: new Date('2024-01-18')
      },
      {
        name: 'Vikash Gupta',
        email: 'vikash.gupta@email.com',
        phone: '9876543214',
        location: 'Jaipur',
        subject: 'Scholarship Information',
        message: 'I want to know about available scholarships and eligibility criteria.',
        createdAt: new Date('2024-01-19')
      }
    ];

    // Insert sample contacts
    await Contact.insertMany(contacts);
    console.log('Sample contacts inserted successfully');

    console.log('Contact seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding contacts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

seedContacts();
