import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';
import nccRoutes from './routes/ncc.routes.js';
import admissionRoutes from './routes/admission.routes.js';
import contactRoutes from './routes/contact.routes.js';
import staffRoutes from './routes/staff.routes.js';
import studentRoutes from './routes/student.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import erpRoutes from './routes/erp.routes.js';
import userRoutes from './routes/user.routes.js';
import feeRoutes from './routes/fee.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import concessionRoutes from './routes/concession.routes.js';
import receiptRoutes from './routes/receipt.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

dotenv.config({ path: './.env' });
console.log('Loading .env from:', process.cwd() + '/.env');
console.log('MONGO_URI:', process.env.MONGO_URI);

connectDB();

const allowedOrigins = ['http://localhost:3000', 'https://college-frontend-snswm.netlify.app'];

const app = express();

// Trust proxy for rate limiting behind load balancers/proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development to allow image loading
}));
app.use(cors({
  origin: ['http://localhost:3000', 'https://college-frontend-snswm.netlify.app'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limit each IP to 500 requests per windowMs for development
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ncc-query', nccRoutes);
app.use('/api/admission-query', admissionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/concessions', concessionRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/promotion', promotionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
