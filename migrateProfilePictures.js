import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import Faculty from './src/models/Faculty.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateProfilePictures = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    const faculties = await Faculty.find({ profilePicture: { $ne: null } });
    let updatedCount = 0;

    for (const faculty of faculties) {
      let { profilePicture } = faculty;
      // Remove the prefix if present
      if (profilePicture.startsWith('/uploads/profile-pictures/')) {
        profilePicture = profilePicture.replace('/uploads/profile-pictures/', '');
        faculty.profilePicture = profilePicture;
        await faculty.save();
        updatedCount++;
        console.log(`Updated profilePicture for faculty ${faculty.username}: ${profilePicture}`);
      } else {
        console.log(`No change needed for ${faculty.username}: ${profilePicture}`);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} records.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateProfilePictures();