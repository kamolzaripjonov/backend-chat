import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const getMyNotifications = async (req, res) => {
    try {
        const {limit = 50, page = 1, type, isRead} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {
            user: req.user._id,
            isDeleted: false
        };

        if (type) query.type = type;
        if (isRead !== undefined) query.isRead = isRead === 'true';

        const notifications = await Notification.find(query)
            .populate('from', 'name username avatar')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false,
            isDeleted: false
        });

        res.json({
            success: true,
            notifications,
            unreadCount,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const markAsRead = async (req, res) => {
    try {
        const {notificationId} = req.params;

        const notification = await Notification.findOne({
            _id: notificationId,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                user: req.user._id,
                isRead: false,
                isDeleted: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const {notificationId} = req.params;

        const notification = await Notification.findOne({
            _id: notificationId,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.isDeleted = true;
        await notification.save();

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            isRead: false,
            isDeleted: false
        });

        res.json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getRecentNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const notifications = await Notification.find({
            user: req.user._id,
            isDeleted: false
        })
            .populate('from', 'name username avatar')
            .sort({createdAt: -1})
            .limit(limit);

        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false,
            isDeleted: false
        });

        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const createNotification = async (data) => {
    try {
        const {
            userId,
            type,
            message,
            from,
            link,
            image,
            extraData,
            fromName,
            fromAvatar
        } = data;

        const user = await User.findById(userId);
        if (!user) {
            console.log(`❌ User not found: ${userId}`);
            return null;
        }

        const settings = user.notificationSettings || {};
        if (settings[type] === false) {
            return null;
        }

        let fromData = null;
        let name = fromName;
        let avatar = fromAvatar;

        if (from) {
            const fromUser = await User.findById(from).select('name username avatar');
            if (fromUser) {
                name = fromUser.name;
                avatar = fromUser.avatar;
                fromData = fromUser._id;
            }
        }

        const notification = await Notification.create({
            user: userId,
            type,
            message,
            from: fromData,
            fromName: name,
            fromAvatar: avatar,
            link: link || null,
            image: image || null,
            data: extraData || {},
            isRead: false
        });

        return await Notification.findById(notification._id)
            .populate('from', 'name username avatar');
    } catch (error) {
        console.error('❌ Create notification error:', error);
        return null;
    }
};

export const createBulkNotifications = async (dataArray) => {
    try {
        const results = [];
        for (const data of dataArray) {
            const result = await createNotification(data);
            if (result) results.push(result);
        }
        return results;
    } catch (error) {
        console.error('❌ Bulk notification error:', error);
        return [];
    }
};