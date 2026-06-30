import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true
    },
    type: {
        type: String,
        enum: [
            'like',
            'comment',
            'reply',
            'mention',
            'story_view',
            'story_reaction',
            'follow',
            'follow_request',
            'follow_accepted',
            'message',
            'call',
            'post_share',
            'post_save',
            'premium_upgrade',
            'plan_expiry',
            'admin_action',
            'system'
        ],
        required: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: 500
    },

    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    fromName: {
        type: String,
        default: null
    },
    fromAvatar: {
        type: String,
        default: null
    },

    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    link: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },

    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

notificationSchema.index({user: 1, createdAt: -1});
notificationSchema.index({user: 1, isRead: 1});
notificationSchema.index({user: 1, isDeleted: 1});
notificationSchema.index({from: 1});

export default mongoose.model('Notification', notificationSchema);