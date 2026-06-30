import Message from '../models/Message.js';
import User from '../models/User.js';

export const sendMessage = async (req, res) => {
    try {
        const {receiverId, content, type} = req.body;

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found'
            });
        }

        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
            if (req.user.limits.messages.remaining <= 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Message limit reached. Please upgrade to Premium!',
                    plan: req.user.plan,
                    remaining: req.user.limits.messages.remaining
                });
            }
        }

        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            content,
            type: type || 'text'
        });

        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
            req.user.limits.messages.used += 1;
            req.user.limits.messages.remaining -= 1;
            await req.user.save();
        }

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name username avatar')
            .populate('receiver', 'name username avatar');

        res.status(201).json({
            success: true,
            message: 'Message sent',
            data: populatedMessage,
            remaining: req.user.limits?.messages?.remaining || '∞'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getMessages = async (req, res) => {
    try {
        const {userId} = req.params;
        const {limit = 50, before} = req.query;

        const query = {
            $or: [
                {sender: req.user._id, receiver: userId},
                {sender: userId, receiver: req.user._id}
            ]
        };

        if (before) {
            query.createdAt = {$lt: new Date(before)};
        }

        const messages = await Message.find(query)
            .populate('sender', 'name username avatar')
            .populate('receiver', 'name username avatar')
            .sort({createdAt: -1})
            .limit(parseInt(limit));

        await Message.updateMany(
            {sender: userId, receiver: req.user._id, isRead: false},
            {isRead: true, readAt: new Date()}
        );

        res.json({
            success: true,
            count: messages.length,
            messages: messages.reverse()
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const markAsRead = async (req, res) => {
    try {
        const {messageId} = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        if (message.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to mark this message as read'
            });
        }

        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};