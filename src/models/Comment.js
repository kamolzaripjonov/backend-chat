import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Post is required']
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0
    },

    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    repliesCount: {
        type: Number,
        default: 0
    },

    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

commentSchema.index({post: 1, createdAt: -1});
commentSchema.index({parentComment: 1});
commentSchema.index({user: 1});

commentSchema.pre('save', function (next) {
    this.likesCount = this.likes.length;
    this.repliesCount = this.replies.length;
    next();
});

export default mongoose.model('Comment', commentSchema);