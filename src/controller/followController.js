import Follow from '../models/Follow.js';
import User from '../models/User.js';
import {createNotification} from './notificationController.js';

export const followUser = async (req, res) => {
    try {
        const {userId} = req.params;
        const currentUser = req.user;

        if (userId === currentUser._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself'
            });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const existingFollow = await Follow.findOne({
            follower: currentUser._id,
            following: userId
        });

        if (existingFollow) {
            if (existingFollow.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'You are already following this user'
                });
            } else {
                existingFollow.isActive = true;
                existingFollow.status = targetUser.isPrivate ? 'pending' : 'accepted';
                existingFollow.acceptedAt = targetUser.isPrivate ? null : new Date();
                await existingFollow.save();

                if (!targetUser.isPrivate) {
                    await User.findByIdAndUpdate(userId, {$inc: {'stats.followers': 1}});
                    await User.findByIdAndUpdate(currentUser._id, {$inc: {'stats.following': 1}});

                    await createNotification({
                        userId: targetUser._id,
                        type: 'follow_accepted',
                        message: `${currentUser.name} started following you`,
                        from: currentUser._id,
                        link: `/profile/${currentUser.username}`,
                        extraData: {username: currentUser.username}
                    });
                } else {
                    await createNotification({
                        userId: targetUser._id,
                        type: 'follow_request',
                        message: `${currentUser.name} requested to follow you`,
                        from: currentUser._id,
                        link: `/profile/${currentUser.username}`,
                        extraData: {username: currentUser.username}
                    });
                }

                return res.json({
                    success: true,
                    message: targetUser.isPrivate ? 'Follow request sent' : 'Followed successfully',
                    isFollowing: true,
                    isPrivate: targetUser.isPrivate
                });
            }
        }

        const follow = await Follow.create({
            follower: currentUser._id,
            following: userId,
            status: targetUser.isPrivate ? 'pending' : 'accepted',
            isActive: true,
            acceptedAt: targetUser.isPrivate ? null : new Date()
        });

        if (!targetUser.isPrivate) {
            await User.findByIdAndUpdate(userId, {$inc: {'stats.followers': 1}});
            await User.findByIdAndUpdate(currentUser._id, {$inc: {'stats.following': 1}});

            await createNotification({
                userId: targetUser._id,
                type: 'follow_accepted',
                message: `${currentUser.name} started following you`,
                from: currentUser._id,
                link: `/profile/${currentUser.username}`,
                extraData: {username: currentUser.username}
            });
        } else {
            await createNotification({
                userId: targetUser._id,
                type: 'follow_request',
                message: `${currentUser.name} requested to follow you`,
                from: currentUser._id,
                link: `/profile/${currentUser.username}`,
                extraData: {username: currentUser.username}
            });
        }

        res.status(201).json({
            success: true,
            message: targetUser.isPrivate ? 'Follow request sent' : 'Followed successfully',
            isFollowing: true,
            isPrivate: targetUser.isPrivate
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const unfollowUser = async (req, res) => {
    try {
        const {userId} = req.params;
        const currentUser = req.user;

        const follow = await Follow.findOne({
            follower: currentUser._id,
            following: userId,
            isActive: true
        });

        if (!follow) {
            return res.status(400).json({
                success: false,
                message: 'You are not following this user'
            });
        }

        follow.isActive = false;
        await follow.save();

        await User.findByIdAndUpdate(userId, {$inc: {'stats.followers': -1}});
        await User.findByIdAndUpdate(currentUser._id, {$inc: {'stats.following': -1}});

        res.json({
            success: true,
            message: 'Unfollowed successfully',
            isFollowing: false
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const checkFollowStatus = async (req, res) => {
    try {
        const {userId} = req.params;

        const follow = await Follow.findOne({
            follower: req.user._id,
            following: userId,
            isActive: true
        });

        const isFollowing = !!follow;
        const isPending = follow?.status === 'pending';

        res.json({
            success: true,
            isFollowing,
            isPending,
            status: follow?.status || null
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getFollowers = async (req, res) => {
    try {
        const {userId} = req.params;
        const {limit = 20, page = 1} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

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

        const followers = await Follow.find({
            following: userId,
            isActive: true,
            status: 'accepted'
        })
            .populate('follower', 'name username avatar bio isVerified')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Follow.countDocuments({
            following: userId,
            isActive: true,
            status: 'accepted'
        });

        res.json({
            success: true,
            followers: followers.map(f => f.follower),
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getFollowing = async (req, res) => {
    try {
        const {userId} = req.params;
        const {limit = 20, page = 1} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

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

        const following = await Follow.find({
            follower: userId,
            isActive: true,
            status: 'accepted'
        })
            .populate('following', 'name username avatar bio isVerified')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Follow.countDocuments({
            follower: userId,
            isActive: true,
            status: 'accepted'
        });

        res.json({
            success: true,
            following: following.map(f => f.following),
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const acceptFollowRequest = async (req, res) => {
    try {
        const {followId} = req.params;

        const follow = await Follow.findById(followId);
        if (!follow) {
            return res.status(404).json({
                success: false,
                message: 'Follow request not found'
            });
        }

        // Check if user is the target
        if (follow.following.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to accept this request'
            });
        }

        if (follow.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This request has already been processed'
            });
        }

        follow.status = 'accepted';
        follow.acceptedAt = new Date();
        await follow.save();

        await User.findByIdAndUpdate(follow.following, {$inc: {'stats.followers': 1}});
        await User.findByIdAndUpdate(follow.follower, {$inc: {'stats.following': 1}});

        const follower = await User.findById(follow.follower).select('name username');

        await createNotification({
            userId: follow.follower,
            type: 'follow_accepted',
            message: `${req.user.name} accepted your follow request`,
            from: req.user._id,
            link: `/profile/${req.user.username}`,
            extraData: {username: req.user.username}
        });

        res.json({
            success: true,
            message: 'Follow request accepted'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const rejectFollowRequest = async (req, res) => {
    try {
        const {followId} = req.params;

        const follow = await Follow.findById(followId);
        if (!follow) {
            return res.status(404).json({
                success: false,
                message: 'Follow request not found'
            });
        }

        if (follow.following.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to reject this request'
            });
        }

        if (follow.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This request has already been processed'
            });
        }

        follow.isActive = false;
        await follow.save();

        res.json({
            success: true,
            message: 'Follow request rejected'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getFollowRequests = async (req, res) => {
    try {
        const {limit = 20, page = 1} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const requests = await Follow.find({
            following: req.user._id,
            status: 'pending',
            isActive: true
        })
            .populate('follower', 'name username avatar bio isVerified')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Follow.countDocuments({
            following: req.user._id,
            status: 'pending',
            isActive: true
        });

        res.json({
            success: true,
            requests: requests.map(f => f.follower),
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};