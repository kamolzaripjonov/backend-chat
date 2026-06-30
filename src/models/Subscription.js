import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plan: {
        type: String,
        enum: ['PREMIUM_1', 'PREMIUM_2', 'PREMIUM_3'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'paypal', 'crypto'],
        required: true
    },
    transactionId: {
        type: String,
        required: true
    }
}, {timestamps: true});

export default mongoose.model('Subscription', subscriptionSchema);