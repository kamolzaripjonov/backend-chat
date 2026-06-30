import mongoose from 'mongoose';
import {CALL_STATUS} from '../utils/constants.js';

const callSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    duration: {
        type: Number,
        default: 0
    },
    maxDuration: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(CALL_STATUS),
        default: CALL_STATUS.STARTED
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date,
        default: null
    }
}, {timestamps: true});

export default mongoose.model('Call', callSchema);