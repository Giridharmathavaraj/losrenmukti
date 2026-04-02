import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    contactEmail: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['enable', 'disable'],
        default: 'enable'
    }
}, { timestamps: true });

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export default Company;
