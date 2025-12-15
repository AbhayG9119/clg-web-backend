import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import DetailedStudentProfile from './src/models/DetailedStudentProfile.js';
import Student from './src/models/studentModel.js';

const seedDetailedProfile = async () => {
  try {
    await connectDB();

    // Get the first student
    const student = await Student.findOne();
    if (!student) {
      console.log('No student found');
      return;
    }

    const detailedProfile = new DetailedStudentProfile({
      student: student._id,
      fatherName: 'John Doe',
      motherName: 'Jane Doe',
      dateOfBirth: new Date('2000-01-01'),
      religion: 'Hindu',
      caste: 'General',
      domicile: 'Delhi',
      aadharNumber: '123456789012',
      rollNumber: '12345',
      college: 'Narayana College',
      course: 'B.Tech',
      branch: 'Computer Science',
      admissionDate: new Date('2020-08-01'),
      admissionMode: 'Entrance Exam',
      admissionSession: '2020-21',
      academicSession: '2023-24',
      currentYear: '3rd Year',
      currentSemester: '6th Semester',
      currentAcademicStatus: 'Active',
      scholarshipApplied: 'Yes',
      hostelApplied: 'Yes',
      contactNumber: '9876543210',
      fatherContactNumber: '9876543211',
      correspondenceAddress: '123 Main St, Delhi',
      permanentAddress: '123 Main St, Delhi',
      email: student.email,
      qualifications: [
        {
          course: '12th',
          streamName: 'Science',
          boardName: 'CBSE',
          rollNumber: '123456',
          passingYear: '2020',
          subjectDetails: 'PCM',
          marksPercentage: '95%'
        }
      ],
      semesterResults: [
        {
          year: '1st Year',
          semester: '1st',
          status: 'Pass',
          marksPercentage: '85%',
          carryOverPapers: 'NIL'
        },
        {
          year: '1st Year',
          semester: '2nd',
          status: 'Pass',
          marksPercentage: '88%',
          carryOverPapers: 'NIL'
        }
      ]
    });

    await detailedProfile.save();
    console.log('Detailed profile seeded successfully');
  } catch (error) {
    console.error('Error seeding detailed profile:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDetailedProfile();
