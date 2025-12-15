// seedFaculty.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Faculty from './src/models/Faculty.js';

dotenv.config({ path: './Backend/.env' });

async function createFaculty() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Array of faculty details for seeding
    const facultyData = [
      {
        email: 'testfaculty@example.com',
        plainPassword: 'TestPass123',
        username: 'Test Faculty',
        department: 'B.Sc',
        subject: 'Computer Science',
        subjectsTaught: ['Computer Science', 'Mathematics']
      },
      {
        email: 'newfaculty@example.com',
        plainPassword: 'NewPass456',
        username: 'New Faculty',
        department: 'B.Sc',
        subject: 'Mathematics',
        subjectsTaught: ['Mathematics', 'Statistics']
      },
      {
        email: 'faculty3@example.com',
        plainPassword: 'Pass789',
        username: 'Faculty Three',
        department: 'B.Sc',
        subject: 'Physics',
        subjectsTaught: ['Physics', 'Quantum Mechanics']
      },
      {
        email: 'faculty4@example.com',
        plainPassword: 'Pass101',
        username: 'Faculty Four',
        department: 'B.Sc',
        subject: 'Chemistry',
        subjectsTaught: ['Chemistry', 'Organic Chemistry']
      },
      {
        email: 'faculty5@example.com',
        plainPassword: 'Pass202',
        username: 'Faculty Five',
        department: 'B.Sc',
        subject: 'Biology',
        subjectsTaught: ['Biology', 'Genetics']
      },
      {
        email: 'faculty6@example.com',
        plainPassword: 'Pass303',
        username: 'Faculty Six',
        department: 'B.A',
        subject: 'History',
        subjectsTaught: ['History', 'World History']
      },
      {
        email: 'faculty7@example.com',
        plainPassword: 'Pass404',
        username: 'Faculty Seven',
        department: 'B.A',
        subject: 'English Literature',
        subjectsTaught: ['English Literature', 'Creative Writing']
      },
      {
        email: 'bedfaculty@clg.com',
        plainPassword: 'BedPass123',
        username: 'B.Ed Faculty',
        department: 'B.Ed',
        subject: 'Education',
        subjectsTaught: ['Education', 'Teaching Methods']
      }
    ];

    // Loop through each faculty and seed
    for (const data of facultyData) {
      const { email, plainPassword, username, department, subject, subjectsTaught } = data;

      // Check if faculty already exists
      const existing = await Faculty.findOne({ email });
      if (existing) {
        console.log(`⚠️ Faculty already exists: ${existing.email}`);
        // Update department, subject, and subjectsTaught if changed
        existing.department = department;
        existing.subject = subject;
        existing.subjectsTaught = subjectsTaught;
        if (!existing.staffId) {
          existing.staffId = `FAC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }
        if (!existing.name) {
          existing.name = username;
        }
        if (!existing.joiningDate) {
          existing.joiningDate = new Date('2023-01-01');
        }
        await existing.save();
        console.log(`🔄 Faculty updated successfully: ${existing.email}`);
        continue;
      }

      // Create new faculty (password will be hashed by schema pre-save hook)
      const faculty = new Faculty({
        username,
        email,
        password: plainPassword,
        department,
        subject,
        subjectsTaught,
        role: 'faculty',
        name: username,
        designation: 'Lecturer',
        joiningDate: new Date('2023-01-01'),
        staffId: `FAC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      });

      await faculty.save();
      console.log(`🎉 Faculty created successfully: ${email}`);
    }
  } catch (err) {
    console.error('❌ Error creating faculty:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

createFaculty();