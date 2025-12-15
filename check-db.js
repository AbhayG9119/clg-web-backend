import connectDB from './config/db.js';
import AdmissionQuery from './models/AdmissionQuery.js';
import NCCQuery from './models/NCCQuery.js';

async function checkDatabase() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Check admission queries
    const admissionCount = await AdmissionQuery.countDocuments();
    console.log(`\nTotal admission queries: ${admissionCount}`);

    if (admissionCount > 0) {
      const admissionQueries = await AdmissionQuery.find().sort({ createdAt: -1 }).limit(10);
      console.log('Recent admission queries:');
      admissionQueries.forEach((query, index) => {
        console.log(`${index + 1}. ${query.name} - ${query.createdAt}`);
      });
    }

    // Check NCC queries
    const nccCount = await NCCQuery.countDocuments();
    console.log(`\nTotal NCC queries: ${nccCount}`);

    if (nccCount > 0) {
      const nccQueries = await NCCQuery.find().sort({ createdAt: -1 }).limit(10);
      console.log('Recent NCC queries:');
      nccQueries.forEach((query, index) => {
        console.log(`${index + 1}. ${query.name} - ${query.createdAt}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
