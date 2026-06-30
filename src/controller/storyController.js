import Story from '../models/Story.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import {createNotification, createBulkNotifications} from './notificationController.js';

export const createStory = async (req, res) => {
    try {
        const {content, media, background, link, location, mentions} = req.body;

        const story = await Story.create({
            user: req.user._id,
            content: content || '',
            media: media || {type: 'text'},
            background: background || 'white',
            link: link || null,
            location: location || null,
            mentions: mentions || []
        });

        await User.findByIdAndUpdate(req.user._id, {$inc: {'stats.stories': 1}});

        if (mentions && mentions.length > 0) {
            const mentionUsers = await User.find({username: {$in: mentions}});
            const notifications = mentionUsers.map(user => ({
                userId: user._id,
                type: 'mention',
                message: `${req.user.name} mentioned you in a story`,
                from: req.user._id,
                link: `/story/${story._id}`,
                extraData: {storyId: story._id}
            }));
            await createBulkNotifications(notifications);
        }

        const populatedStory = await Story.findById(story._id)
            .populate('user', 'name username avatar bio isVerified');

        res.status(201).json({
            success: true,
            message: 'Story created successfully',
            data: populatedStory
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getStories = async (req, res) => {
    try {
        const following = await Follow.find({
            follower: req.user._id,
            isActive: true,
            status: 'accepted'
        }).select('following');

        const followingIds = following.map(f => f.following);
        followingIds.push(req.user._id);

        const stories = await Story.find({
            user: {$in: followingIds},
            isActive: true,
            expiresAt: {$gt: new Date()},
            isArchived: false
        })
            .populate('user', 'name username avatar bio isVerified')
            .populate('viewers.user', 'name username avatar')
            .populate('reactions.user', 'name username')
            .sort({createdAt: -1});

        const groupedStories = {};
        stories.forEach(story => {
            const userId = story.user._id.toString();
            if (!groupedStories[userId]) {
                groupedStories[userId] = {
                    user: story.user,
                    stories: []
                };
            }
            const storyObj = story.toObject();
            storyObj.isViewed = story.viewers.some(v => v.user._id.toString() === req.user._id.toString());
            groupedStories[userId].stories.push(storyObj);
        });

        res.json({
            success: true,
            data: Object.values(groupedStories)
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getUserStories = async (req, res) => {
    try {
        const {userId} = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isPrivate) {
            const isFollowing = await Follow.findOne({
                follower: req.user._id,
                following: userId,
                isActive: true,
                status: 'accepted'
            });

            if (req.user._id.toString() !== userId && !isFollowing) {
                return res.status(403).json({
                    success: false,
                    message: 'This account is private'
                });
            }
        }

        const stories = await Story.find({
            user: userId,
            isActive: true,
            expiresAt: {$gt: new Date()},
            isArchived: false
        })
            .populate('user', 'name username avatar bio isVerified')
            .populate('viewers.user', 'name username avatar')
            .sort({createdAt: -1});

        const storiesWithStatus = stories.map(story => {
            const storyObj = story.toObject();
            storyObj.isViewed = story.viewers.some(v => v.user._id.toString() === req.user._id.toString());
            return storyObj;
        });

        res.json({
            success: true,
            stories: storiesWithStatus
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const viewStory = async (req, res) => {
    try {
        const {storyId} = req.params;

        const story = await Story.findById(storyId).populate('user', 'name username');
        if (!story || !story.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        const alreadyViewed = story.viewers.some(v => v.user.toString() === req.user._id.toString());

        if (!alreadyViewed) {
            story.viewers.push({
                user: req.user._id,
                viewedAt: new Date()
            });
            await story.save();

            if (story.user._id.toString() !== req.user._id.toString()) {
                await createNotification({
                    userId: story.user._id,
                    type: 'story_view',
                    message: `${req.user.name} viewed your story`,
                    from: req.user._id,
                    link: `/story/${storyId}`,
                    extraData: {storyId, viewer: req.user.name}
                });
            }
        }

        res.json({
            success: true,
            message: 'Story viewed',
            viewers: story.viewers.length,
            alreadyViewed
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const reactToStory = async (req, res) => {
    try {
        const {storyId} = req.params;
        const {type} = req.body;

        const story = await Story.findById(storyId).populate('user', 'name username');
        if (!story || !story.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        const existingReaction = story.reactions.find(r => r.user.toString() === req.user._id.toString());

        if (existingReaction) {
            existingReaction.type = type;
        } else {
            story.reactions.push({
                user: req.user._id,
                type
            });
        }

        await story.save();

        if (story.user._id.toString() !== req.user._id.toString()) {
            await createNotification({
                userId: story.user._id,
                type: 'story_reaction',
                message: `${req.user.name} reacted ${type} to your story`,
                from: req.user._id,
                link: `/story/${storyId}`,
                extraData: {storyId, reaction: type}
            });
        }

        res.json({
            success: true,
            message: 'Reaction added',
            reaction: type
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const deleteStory = async (req, res) => {
    try {
        const {storyId} = req.params;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        if (story.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'ADMIN' &&
            req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this story'
            });
        }

        story.isActive = false;
        story.isArchived = true;
        await story.save();

        await User.findByIdAndUpdate(req.user._id, {$inc: {'stats.stories': -1}});

        res.json({
            success: true,
            message: 'Story deleted successfully'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};