import mongoose from 'mongoose';

const hostelFeeSchema = new mongoose.Schema({
  hostelId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  hostelName: {
    type: String,
    required: true,
    trim: true
  },
  roomType: {
    type: String,
    required: true,
    enum: ['Single', 'Double', 'Triple', 'Dormitory']
  },
  feeType: {
    type: String,
    required: true,
    enum: ['Monthly', 'Yearly']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const HostelFee = mongoose.model('HostelFee', hostelFeeSchema);

export default HostelFee;
