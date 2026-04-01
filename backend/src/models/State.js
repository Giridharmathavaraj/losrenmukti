import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  interestRate: {
    type: Number,
    required: true,
    default: 0
  },
  originationFees: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved'],
    default: 'Pending'
  },
  minLoanAmount: {
    type: Number,
    required: true,
    default: 0
  },
  maxLoanAmount: {
    type: Number,
    required: true,
    default: 0
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  } // Setting to false so superadmins can create global states, but keeping it available for multi-tenant rules
}, {
  timestamps: true
});

// Ensure a single company can't have duplicate state codes or names
stateSchema.index({ code: 1, companyId: 1 }, { unique: true });
stateSchema.index({ name: 1, companyId: 1 }, { unique: true });

const State = mongoose.model('State', stateSchema);

export default State;
