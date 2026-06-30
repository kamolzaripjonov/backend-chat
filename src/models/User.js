import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {PLANS, ROLES} from '../utils/constants.js';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    },
    plan: {
        type: String,
        enum: Object.keys(PLANS),
        default: 'FREE'
    },
    limits: {
        posts: {total: Number, used: Number, remaining: Number},
        calls: {total: Number, used: Number, remaining: Number, maxDuration: Number},
        messages: {total: Number, used: Number, remaining: Number}
    },
    planExpiry: {type: Date, default: null},
    acceptedTerms: {type: Boolean, default: false},
    acceptedAt: {type: Date, default: null},
    avatar: {type: String, default: null},
    isActive: {type: Boolean, default: true},
    online: {type: Boolean, default: false},
    lastSeen: {type: Date, default: Date.now}
}, {timestamps: true});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.createJWT = function () {
    return jwt.sign(
        {id: this._id, email: this.email, role: this.role},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRE}
    );
};

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

export default mongoose.model('User', userSchema);