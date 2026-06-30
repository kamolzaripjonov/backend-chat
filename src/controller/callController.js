import Call from '../models/Call.js';
import User from '../models/User.js';
import {CALL_STATUS} from '../utils/constants.js';

export const startCall = async (req, res) => {
    try {
        const {receiverId} = req.body;

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found'
            });
        }

        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
            if (req.user.limits.calls.remaining <= 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Video call limit reached. Please upgrade to Premium!',
                    plan: req.user.plan,
                    remaining: req.user.limits.calls.remaining
                });
            }
        }

        const call = await Call.create({
            user: req.user._id,
            receiver: receiverId,
            maxDuration: req.user.limits.calls.maxDuration || 5,
            status: CALL_STATUS.STARTED
        });

        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
            req.user.limits.calls.used += 1;
            req.user.limits.calls.remaining -= 1;
            await req.user.save();
        }

        res.status(201).json({
            success: true,
            message: 'Video call started',
            data: {
                callId: call._id,
                maxDuration: call.maxDuration,
                remainingCalls: req.user.limits?.calls?.remaining || '∞'
            }
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const endCall = async (req, res) => {
    try {
        const {callId, duration} = req.body;

        const call = await Call.findById(callId);
        if (!call) {
            return res.status(404).json({
                success: false,
                message: 'Call not found'
            });
        }

        if (duration > call.maxDuration) {
            return res.status(400).json({
                success: false,
                message: `Call duration exceeded ${call.maxDuration} minutes!`,
                maxDuration: call.maxDuration
            });
        }

        call.duration = duration;
        call.status = CALL_STATUS.ENDED;
        call.endedAt = new Date();
        await call.save();

        res.json({
            success: true,
            message: 'Video call ended',
            data: {duration}
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getCallHistory = async (req, res) => {
    try {
        const {userId} = req.params;
        const {limit = 20} = req.query;

        const calls = await Call.find({
            $or: [
                {user: req.user._id, receiver: userId},
                {user: userId, receiver: req.user._id}
            ]
        })
            .populate('user', 'name username avatar')
            .populate('receiver', 'name username avatar')
            .sort({createdAt: -1})
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: calls.length,
            calls
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};