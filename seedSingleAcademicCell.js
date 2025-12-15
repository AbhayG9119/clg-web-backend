import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import AcademicCell from './src/models/AcademicCell.js';

dotenv.config();

const seedSingleAcademicCell = async () => {
  try {
    await connectDB();

    // Clear existing academic cell users
    await AcademicCell.deleteMany({});
    console.log('Cleared existing academic cell users');

    // Create a single academic cell user with comprehensive access
    const academicCellUser = {
      username: 'Dr. Academic Head',
      email: 'academic@college.edu',
      password: 'academic123',
      department: 'Academic Affairs',
      employeeId: 'AC001',
      phone: '+91-9876543210',
      role: 'academic-cell'
    };

    // Insert the academic cell user
    const createdUser = await AcademicCell.create(academicCellUser);
    console.log('Academic cell user created successfully');

    console.log('\n🎓 Academic Cell Login Credentials:');
    console.log('='.repeat(50));
    console.log(`Username: ${createdUser.username}`);
    console.log(`Email: ${createdUser.email}`);
    console.log(`Password: ${academicCellUser.password}`);
    console.log(`Department: ${createdUser.department}`);
    console.log(`Employee ID: ${createdUser.employeeId}`);
    console.log(`Role: ${createdUser.role}`);
    console.log('-'.repeat(30));

    console.log('\n✅ Academic Cell user setup completed!');
    console.log('This user has access to:');
    console.log('- Student profile management');
    console.log('- Course management');
    console.log('- Admission oversight');
    console.log('- Document verification');
    console.log('- Communication templates');
    console.log('- Task management');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding academic cell user:', error);
    process.exit(1);
  }
};

seedSingleAcademicCell();
