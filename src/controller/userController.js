import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -__v');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const updateProfile = async (req, res) => {
    try {
        const {name, avatar, username} = req.body;

        if (username && username !== req.user.username) {
            const existingUser = await User.findOne({username});
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username is already taken'
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {name, avatar, username},
            {new: true, runValidators: true}
        ).select('-password -__v');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getMyLimits = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('plan limits planExpiry');

        res.json({
            success: true,
            plan: user.plan,
            limits: user.limits,
            planExpiry: user.planExpiry
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const searchUsers = async (req, res) => {
    try {
        const {query} = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const users = await User.find({
            $or: [
                {username: {$regex: query, $options: 'i'}},
                {name: {$regex: query, $options: 'i'}}
            ],
            isActive: true
        })
            .select('-password -__v')
            .limit(20);

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};