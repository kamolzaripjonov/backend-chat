import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    content: {
        type: String,
        required: [true, 'Post content is required'],
        trim: true,
        maxlength: [2200, 'Post cannot exceed 2200 characters']
    },

    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'gif'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            default: null
        },
        duration: {
            type: Number,
            default: null
        }
    }],

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0
    },

    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: {
            type: String,
            trim: true,
            required: true,
            maxlength: [500, 'Comment cannot exceed 500 characters']
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        replies: [{
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            content: {type: String, trim: true, maxlength: 500},
            likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
            createdAt: {type: Date, default: Date.now}
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    commentsCount: {
        type: Number,
        default: 0
    },

    shares: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sharesCount: {
        type: Number,
        default: 0
    },
    savedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    hashtags: [{
        type: String,
        trim: true,
        lowercase: true
    }],

    location: {
        name: {type: String, default: null},
        lat: {type: Number, default: null},
        lng: {type: Number, default: null}
    },

    isActive: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

postSchema.index({user: 1, createdAt: -1});
postSchema.index({hashtags: 1});
postSchema.index({likesCount: -1});
postSchema.index({createdAt: -1});

postSchema.pre('save', function (next) {
    this.likesCount = this.likes.length;

    this.commentsCount = this.comments.length;

    this.sharesCount = this.shares.length;

    next();
});

export default mongoose.model('Post', postSchema);