import mongoose from 'mongoose';
import Receipt from './src/models/Receipt.js';
import AcademicSession from './src/models/AcademicSession.js';

const checkReceiptSessions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/college-erp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all duplicate receipts
    const duplicateReceipts = await Receipt.find({ isDuplicate: true });

    console.log(`Found ${duplicateReceipts.length} duplicate receipts`);

    for (const receipt of duplicateReceipts) {
      console.log(`Receipt ${receipt.receiptNumber}: sessionId = ${receipt.sessionId}`);

      if (receipt.sessionId) {
        const session = await AcademicSession.findById(receipt.sessionId);
        if (session) {
          console.log(`  Session found: ${session.sessionId} (${session.startDate} - ${session.endDate})`);
        } else {
          console.log(`  Session NOT found for ID: ${receipt.sessionId}`);
        }
      } else {
        console.log(`  No sessionId set`);
      }
    }

    console.log('Check completed');
  } catch (error) {
    console.error('Error checking receipts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkReceiptSessions();
