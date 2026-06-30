import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import {createNotification, createBulkNotifications} from './notificationController.js';

export const createPost = async (req, res) => {
    try {
        const {content, media, hashtags, location, mentions} = req.body;

        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
            if (req.user.limits.posts.remaining <= 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Post limit reached. Please upgrade to Premium!',
                    plan: req.user.plan,
                    remaining: req.user.limits.posts.remaining
                });
            }
        }

        const processedHashtags = hashtags || content.match(/#\w+/g)?.map(t => t.toLowerCase()) || [];

        const processedMentions = mentions || content.match(/@\w+/g)?.map(t => t.replace('@', '')) || [];
        const mentionUsers = await User.find({
            username: {$in: processedMentions}
        }).select('_id');

        const post = await Post.create({
            user: req.user._id,
            content,
            media: media || [],
            hashtags: processedHashtags,
            location: location || null,
            mentions: mentionUsers.map(u => u._id)
        });

        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
            req.user.limits.posts.used += 1;
            req.user.limits.posts.remaining -= 1;
            await req.user.save();
        }

        await User.findByIdAndUpdate(req.user._id, {$inc: {'stats.posts': 1}});

        if (mentionUsers.length > 0) {
            const notifications = mentionUsers.map(user => ({
                userId: user._id,
                type: 'mention',
                message: `${req.user.name} mentioned you in a post`,
                from: req.user._id,
                link: `/post/${post._id}`,
                extraData: {postId: post._id}
            }));
            await createBulkNotifications(notifications);
        }

        const populatedPost = await Post.findById(post._id)
            .populate('user', 'name username avatar bio isVerified');

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: populatedPost,
            remaining: req.user.limits?.posts?.remaining || '∞'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getPosts = async (req, res) => {
    try {
        const {limit = 20, page = 1, userId, hashtag} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {isActive: true, isDeleted: false};

        if (userId) {
            query.user = userId;
        }

        if (hashtag) {
            query.hashtags = hashtag.toLowerCase();
        }

        const posts = await Post.find(query)
            .populate('user', 'name username avatar bio isVerified')
            .populate('likes', 'name username')
            .populate('comments.user', 'name username')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Post.countDocuments(query);

        const postsWithStatus = posts.map(post => {
            const postObj = post.toObject();
            postObj.isLiked = post.likes.some(like => like._id.toString() === req.user._id.toString());
            return postObj;
        });

        res.json({
            success: true,
            posts: postsWithStatus,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getPostById = async (req, res) => {
    try {
        const {postId} = req.params;

        const post = await Post.findById(postId)
            .populate('user', 'name username avatar bio isVerified')
            .populate('likes', 'name username')
            .populate('comments.user', 'name username')
            .populate('comments.replies.user', 'name username');

        if (!post || post.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const postObj = post.toObject();
        postObj.isLiked = post.likes.some(like => like._id.toString() === req.user._id.toString());
        postObj.isSaved = req.user.savedPosts.includes(postId);

        res.json({
            success: true,
            post: postObj
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const updatePost = async (req, res) => {
    try {
        const {postId} = req.params;
        const {content, location} = req.body;

        const post = await Post.findById(postId);
        if (!post || post.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this post'
            });
        }

        post.content = content || post.content;
        post.location = location || post.location;
        await post.save();

        const updatedPost = await Post.findById(postId)
            .populate('user', 'name username avatar bio isVerified');

        res.json({
            success: true,
            message: 'Post updated successfully',
            data: updatedPost
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const deletePost = async (req, res) => {
    try {
        const {postId} = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'ADMIN' &&
            req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this post'
            });
        }

        post.isDeleted = true;
        post.isActive = false;
        await post.save();

        await User.findByIdAndUpdate(post.user, {$inc: {'stats.posts': -1}});

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const toggleLike = async (req, res) => {
    try {
        const {postId} = req.params;
        const post = await Post.findById(postId).populate('user', 'name username');

        if (!post || post.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const likeIndex = post.likes.indexOf(req.user._id);
        let isLiked = false;

        if (likeIndex === -1) {
            post.likes.push(req.user._id);
            isLiked = true;

            if (post.user._id.toString() !== req.user._id.toString()) {
                await createNotification({
                    userId: post.user._id,
                    type: 'like',
                    message: `${req.user.name} liked your post`,
                    from: req.user._id,
                    link: `/post/${postId}`,
                    image: post.media[0]?.url || null,
                    extraData: {postId, content: post.content.substring(0, 50)}
                });
            }
        } else {
            post.likes.splice(likeIndex, 1);
            isLiked = false;
        }

        await post.save();

        res.json({
            success: true,
            message: isLiked ? 'Post liked' : 'Like removed',
            isLiked,
            likes: post.likes.length
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const toggleSave = async (req, res) => {
    try {
        const {postId} = req.params;
        const user = req.user;

        const post = await Post.findById(postId);
        if (!post || post.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const saveIndex = user.savedPosts.indexOf(postId);
        let isSaved = false;

        if (saveIndex === -1) {
            user.savedPosts.push(postId);
            isSaved = true;
            post.savedBy.push(user._id);
        } else {
            user.savedPosts.splice(saveIndex, 1);
            isSaved = false;
            post.savedBy.pull(user._id);
        }

        await user.save();
        await post.save();

        if (isSaved && post.user.toString() !== user._id.toString()) {
            await createNotification({
                userId: post.user,
                type: 'post_save',
                message: `${user.name} saved your post`,
                from: user._id,
                link: `/post/${postId}`,
                extraData: {postId}
            });
        }

        res.json({
            success: true,
            message: isSaved ? 'Post saved' : 'Post unsaved',
            isSaved
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const sharePost = async (req, res) => {
    try {
        const {postId} = req.params;
        const {userId} = req.body;

        const post = await Post.findById(postId);
        if (!post || post.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        post.shares.push(req.user._id);
        await post.save();

        if (userId) {
            await createNotification({
                userId: userId,
                type: 'post_share',
                message: `${req.user.name} shared a post with you`,
                from: req.user._id,
                link: `/post/${postId}`,
                extraData: {postId, sharer: req.user.name}
            });
        }

        res.json({
            success: true,
            message: 'Post shared successfully',
            shares: post.shares.length
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getSavedPosts = async (req, res) => {
    try {
        const {limit = 20, page = 1} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const user = await User.findById(req.user._id)
            .populate({
                path: 'savedPosts',
                populate: {path: 'user', select: 'name username avatar bio isVerified'},
                match: {isDeleted: false, isActive: true}
            });

        const savedPosts = user.savedPosts.slice(skip, skip + parseInt(limit));

        res.json({
            success: true,
            posts: savedPosts,
            total: user.savedPosts.length,
            page: parseInt(page),
            totalPages: Math.ceil(user.savedPosts.length / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};