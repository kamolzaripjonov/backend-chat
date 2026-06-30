import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    content: {
        type: String,
        trim: true,
        maxlength: [500, 'Story cannot exceed 500 characters']
    },

    media: {
        type: {
            type: String,
            enum: ['image', 'video', 'gif', 'text'],
            default: 'text'
        },
        url: {
            type: String,
            default: null
        },
        thumbnail: {
            type: String,
            default: null
        },
        duration: {
            type: Number,
            default: 5
        }
    },

    background: {
        type: String,
        enum: ['white', 'black', 'gradient_1', 'gradient_2', 'gradient_3', 'gradient_4', 'gradient_5'],
        default: 'white'
    },

    viewers: [{
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        viewedAt: {type: Date, default: Date.now}
    }],
    viewersCount: {
        type: Number,
        default: 0
    },

    reactions: [{
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        type: {
            type: String,
            enum: ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '💯', '🎉', '🤣']
        },
        createdAt: {type: Date, default: Date.now}
    }],

    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    link: {
        type: String,
        default: null
    },

    location: {
        name: {type: String, default: null},
        lat: {type: Number, default: null},
        lng: {type: Number, default: null}
    },

    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

storySchema.index({user: 1, createdAt: -1});
storySchema.index({expiresAt: 1});
storySchema.index({isActive: 1});

storySchema.pre('save', function (next) {
    this.viewersCount = this.viewers.length;
    next();
});

export default mongoose.model('Story', storySchema);