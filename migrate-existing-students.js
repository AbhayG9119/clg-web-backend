import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AcademicSession from './src/models/AcademicSession.js';
import StudentBAS from './src/models/StudentBAS.js';
import StudentBSc from './src/models/StudentBSc.js';
import StudentBEd from './src/models/StudentBEd.js';

dotenv.config();

const migrateExistingStudents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college-management');
    console.log('Connected to MongoDB');

    // Get the active session
    const activeSession = await AcademicSession.findOne({ isActive: true });
    if (!activeSession) {
      console.log('No active session found. Please create and activate a session first.');
      return;
    }

    console.log(`Using active session: ${activeSession.sessionId}`);

    // Define student models
    const studentModels = [
      { model: StudentBAS, name: 'StudentBAS', department: 'B.A' },
      { model: StudentBSc, name: 'StudentBSc', department: 'B.Sc' },
      { model: StudentBEd, name: 'StudentBEd', department: 'B.Ed' }
    ];

    let totalUpdated = 0;

    for (const { model, name, department } of studentModels) {
      console.log(`\nProcessing ${name}...`);

      // Find students without sessionId, batchId, or admissionYear
      const studentsToUpdate = await model.find({
        $or: [
          { sessionId: { $exists: false } },
          { batchId: { $exists: false } },
          { admissionYear: { $exists: false } }
        ]
      });

      console.log(`Found ${studentsToUpdate.length} students in ${name} needing updates`);

      for (const student of studentsToUpdate) {
        // Find appropriate batch for this student's department and year
        const appropriateBatch = activeSession.batches.find(batch =>
          batch.department === department && batch.year === student.year
        );

        if (!appropriateBatch) {
          console.log(`Warning: No batch found for ${department} Year ${student.year} in session ${activeSession.sessionId}`);
          console.log(`Student ${student.studentId} (${student.firstName} ${student.lastName}) will be assigned to first available batch`);
          // Assign first batch of the department if no exact match
          const deptBatch = activeSession.batches.find(batch => batch.department === department);
          if (deptBatch) {
            student.batchId = deptBatch.batchId;
          } else {
            console.log(`Error: No batches available for department ${department}`);
            continue;
          }
        } else {
          student.batchId = appropriateBatch.batchId;
        }

        // Set sessionId
        student.sessionId = activeSession._id;

        // Calculate admission year based on current year and student's year
        const currentYear = new Date().getFullYear();
student.admissionYear = currentYear - student.year + 2;

        await student.save();
        totalUpdated++;
        console.log(`Updated student ${student.studentId}: batchId=${student.batchId}, sessionId=${activeSession.sessionId}, admissionYear=${student.admissionYear}`);
      }
    }

    console.log(`\nMigration completed successfully!`);
    console.log(`Total students updated: ${totalUpdated}`);

    // Verify the migration
    console.log('\nVerifying migration...');
    for (const { model, name } of studentModels) {
      const count = await model.countDocuments({
        sessionId: { $exists: true },
        batchId: { $exists: true },
        admissionYear: { $exists: true }
      });
      console.log(`${name}: ${count} students have all required session fields`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
migrateExistingStudents();
