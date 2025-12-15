import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './src/models/Admin.js';

dotenv.config({ path: './.env' });

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Admin details for testing
    const email = 'abhaygupta9696@gmail.com';
    const plainPassword = 'StrongPass123';
    const role = 'admin';

    // Check if admin already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('⚠️ Admin already exists:', existing.email);
      // Update role if changed
      existing.role = role;
      await existing.save();
      console.log('🔄 Admin updated successfully:', existing.email);
      return;
    }

    // Create new admin (password will be hashed by schema pre-save hook)
    const admin = new Admin({
      email,
      password: plainPassword,
      role
    });

    await admin.save();
    console.log('🎉 Admin created successfully:', email);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

createAdmin();
