import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
  course: {
    type: String,
    required: true,
    enum: ['B.A', 'B.Sc', 'B.Ed'],
    unique: true
  },
  feeComponents: {
    tuitionFee: { type: Number, required: true },
    libraryFee: { type: Number, required: true },
    laboratoryFee: { type: Number, default: 0 },
    examinationFee: { type: Number, required: true },
    sportsFee: { type: Number, required: true },
    developmentFee: { type: Number, required: true },
    miscellaneousFee: { type: Number, required: true }
  },
  totalFee: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate total fee
feeStructureSchema.pre('save', function(next) {
  const components = this.feeComponents;
  this.totalFee = components.tuitionFee + components.libraryFee + components.laboratoryFee +
                  components.examinationFee + components.sportsFee + components.developmentFee +
                  components.miscellaneousFee;
  next();
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

export default FeeStructure;
