import User from '../models/User.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password -__v')
            .sort({createdAt: -1});

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getUserDetails = async (req, res) => {
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

export const updateUserRole = async (req, res) => {
    try {
        const {id} = req.params;
        const {role} = req.body;

        if (!['USER', 'ADMIN', 'SUPERADMIN'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            {role},
            {new: true, runValidators: true}
        ).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `User role changed to ${role}`,
            user
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const updateUserPlan = async (req, res) => {
    try {
        const {id} = req.params;
        const {plan} = req.body;

        if (!['FREE', 'PREMIUM_1', 'PREMIUM_2', 'PREMIUM_3'].includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.plan = plan;
        await user.save();

        res.json({
            success: true,
            message: `User plan changed to ${plan}`,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const deleteUser = async (req, res) => {
    try {
        const {id} = req.params;

        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete yourself'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            {isActive: false},
            {new: true}
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};