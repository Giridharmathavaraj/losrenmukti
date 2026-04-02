import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin', 'users'],
        default: 'users'
    },
    status: {
        type: String,
        enum: ['enable', 'disable'],
        default: 'enable'
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
