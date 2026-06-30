import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import {createNotification} from './notificationController.js';

export const addComment = async (req, res) => {
    try {
        const {postId} = req.params;
        const {content} = req.body;

        const post = await Post.findById(postId).populate('user', 'name username');
        if (!post || post.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const comment = await Comment.create({
            user: req.user._id,
            post: postId,
            content
        });

        post.comments.push({
            user: req.user._id,
            content,
            createdAt: new Date()
        });
        await post.save();

        if (post.user._id.toString() !== req.user._id.toString()) {
            await createNotification({
                userId: post.user._id,
                type: 'comment',
                message: `${req.user.name} commented on your post: "${content.substring(0, 50)}..."`,
                from: req.user._id,
                link: `/post/${postId}`,
                image: post.media[0]?.url || null,
                extraData: {postId, comment: content, commentId: comment._id}
            });
        }

        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'name username avatar bio isVerified');

        res.status(201).json({
            success: true,
            message: 'Comment added',
            data: populatedComment
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getComments = async (req, res) => {
    try {
        const {postId} = req.params;
        const {limit = 20, page = 1} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const comments = await Comment.find({
            post: postId,
            isActive: true,
            isDeleted: false,
            parentComment: null
        })
            .populate('user', 'name username avatar bio isVerified')
            .populate('replies', 'user content likes createdAt')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Comment.countDocuments({
            post: postId,
            isActive: true,
            isDeleted: false,
            parentComment: null
        });

        res.json({
            success: true,
            comments,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const updateComment = async (req, res) => {
    try {
        const {commentId} = req.params;
        const {content} = req.body;

        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this comment'
            });
        }

        comment.content = content;
        await comment.save();

        const updatedComment = await Comment.findById(commentId)
            .populate('user', 'name username avatar bio isVerified');

        res.json({
            success: true,
            message: 'Comment updated',
            data: updatedComment
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const deleteComment = async (req, res) => {
    try {
        const {commentId} = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (comment.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'ADMIN' &&
            req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this comment'
            });
        }

        comment.isDeleted = true;
        comment.isActive = false;
        await comment.save();

        await Post.updateOne(
            {_id: comment.post, 'comments._id': commentId},
            {$pull: {comments: {_id: commentId}}}
        );

        res.json({
            success: true,
            message: 'Comment deleted'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const toggleCommentLike = async (req, res) => {
    try {
        const {commentId} = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const likeIndex = comment.likes.indexOf(req.user._id);
        let isLiked = false;

        if (likeIndex === -1) {
            comment.likes.push(req.user._id);
            isLiked = true;
        } else {
            comment.likes.splice(likeIndex, 1);
            isLiked = false;
        }

        await comment.save();

        res.json({
            success: true,
            message: isLiked ? 'Comment liked' : 'Like removed',
            isLiked,
            likes: comment.likes.length
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const replyToComment = async (req, res) => {
    try {
        const {commentId} = req.params;
        const {content} = req.body;

        const parentComment = await Comment.findById(commentId);
        if (!parentComment || parentComment.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const reply = await Comment.create({
            user: req.user._id,
            post: parentComment.post,
            content,
            parentComment: commentId
        });

        parentComment.replies.push(reply._id);
        await parentComment.save();

        await Post.updateOne(
            {_id: parentComment.post},
            {$push: {comments: {user: req.user._id, content, createdAt: new Date()}}}
        );

        if (parentComment.user.toString() !== req.user._id.toString()) {
            await createNotification({
                userId: parentComment.user,
                type: 'reply',
                message: `${req.user.name} replied to your comment: "${content.substring(0, 50)}..."`,
                from: req.user._id,
                link: `/post/${parentComment.post}`,
                extraData: {commentId: commentId, replyId: reply._id}
            });
        }

        const populatedReply = await Comment.findById(reply._id)
            .populate('user', 'name username avatar bio isVerified');

        res.status(201).json({
            success: true,
            message: 'Reply added',
            data: populatedReply
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};