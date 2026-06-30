import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Follower is required']
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Following is required']
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    acceptedAt: {
        type: Date,
        default: null
    }
}, {timestamps: true});

followSchema.index({follower: 1, following: 1}, {unique: true});
followSchema.index({following: 1, status: 1});
followSchema.index({follower: 1, status: 1});

export default mongoose.model('Follow', followSchema);