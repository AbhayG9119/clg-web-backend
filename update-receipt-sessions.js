import mongoose from 'mongoose';
import Receipt from './src/models/Receipt.js';
import StudentBAS from './src/models/StudentBAS.js';
import StudentBSc from './src/models/StudentBSc.js';
import StudentBEd from './src/models/StudentBEd.js';

const updateReceiptSessions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/college-erp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all duplicate receipts without sessionId
    const receiptsWithoutSession = await Receipt.find({
      isDuplicate: true,
      $or: [
        { sessionId: null },
        { sessionId: { $exists: false } }
      ]
    });

    console.log(`Found ${receiptsWithoutSession.length} duplicate receipts without sessionId`);

    for (const receipt of receiptsWithoutSession) {
      // Find the student
      let student = await StudentBAS.findOne({ studentId: receipt.studentId });
      if (!student) {
        student = await StudentBSc.findOne({ studentId: receipt.studentId });
      }
      if (!student) {
        student = await StudentBEd.findOne({ studentId: receipt.studentId });
      }

      if (student && student.sessionId) {
        // Update the receipt with sessionId
        await Receipt.findByIdAndUpdate(receipt._id, { sessionId: student.sessionId });
        console.log(`Updated receipt ${receipt.receiptNumber} with sessionId ${student.sessionId}`);
      } else {
        console.log(`No session found for student ${receipt.studentId} in receipt ${receipt.receiptNumber}`);
      }
    }

    console.log('Update completed');
  } catch (error) {
    console.error('Error updating receipts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updateReceiptSessions();
