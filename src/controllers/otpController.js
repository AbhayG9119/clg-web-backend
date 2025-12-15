import nodemailer from 'nodemailer';
import twilio from 'twilio';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// Twilio client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get student model based on department
const getStudentModel = (department) => {
  if (department === 'B.A') return StudentBAS;
  if (department === 'B.Sc') return StudentBSc;
  if (department === 'B.Ed') return StudentBEd;
  return null;
};

// Send email OTP
export const sendEmailOTP = async (req, res) => {
  const { email, department } = req.body;

  try {
    const StudentModel = getStudentModel(department);
    if (!StudentModel) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    const user = await StudentModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    await StudentModel.findByIdAndUpdate(user._id, {
      emailOTP: otp,
      otpExpiry
    });

    // Send email
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your OTP for email verification is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent to email successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send mobile OTP
export const sendMobileOTP = async (req, res) => {
  const { mobileNumber, department } = req.body;

  try {
    const StudentModel = getStudentModel(department);
    if (!StudentModel) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    const user = await StudentModel.findOne({ mobileNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    await StudentModel.findByIdAndUpdate(user._id, {
      mobileOTP: otp,
      otpExpiry
    });

    // Send SMS
    await twilioClient.messages.create({
      body: `Your OTP for mobile verification is: ${otp}. This OTP will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${mobileNumber}`
    });

    res.json({ message: 'OTP sent to mobile successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify email OTP
export const verifyEmailOTP = async (req, res) => {
  const { email, otp, department } = req.body;

  try {
    const StudentModel = getStudentModel(department);
    if (!StudentModel) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    const user = await StudentModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark email as verified and clear OTP
    await StudentModel.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      emailOTP: null,
      otpExpiry: null
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify mobile OTP
export const verifyMobileOTP = async (req, res) => {
  const { mobileNumber, otp, department } = req.body;

  try {
    const StudentModel = getStudentModel(department);
    if (!StudentModel) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    const user = await StudentModel.findOne({ mobileNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.mobileOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark mobile as verified and clear OTP
    await StudentModel.findByIdAndUpdate(user._id, {
      isMobileVerified: true,
      mobileOTP: null,
      otpExpiry: null
    });

    res.json({ message: 'Mobile verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
