import User from '../models/User.js';
import {PLANS} from '../utils/constants.js';

export const register = async (req, res) => {
    try {
        const {email, username, password, name, acceptedTerms} = req.body;

        if (!acceptedTerms) {
            return res.status(400).json({
                success: false,
                message: 'You must accept the Terms & Conditions'
            });
        }

        const existingUser = await User.findOne({
            $or: [{email}, {username}]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'This email is already registered'
                    : 'This username is already taken'
            });
        }

        const user = await User.create({
            email,
            username,
            password,
            name: name || username,
            acceptedTerms: true,
            acceptedAt: new Date(),
            plan: 'FREE',
            limits: {
                posts: {used: 0, total: PLANS.FREE.posts, remaining: PLANS.FREE.posts},
                calls: {
                    used: 0,
                    total: PLANS.FREE.calls,
                    remaining: PLANS.FREE.calls,
                    maxDuration: PLANS.FREE.callDuration
                },
                messages: {used: 0, total: PLANS.FREE.messages, remaining: PLANS.FREE.messages}
            }
        });

        const token = user.createJWT();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({email}).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'User is blocked'
            });
        }

        user.online = true;
        user.lastSeen = new Date();
        await user.save();

        const token = user.createJWT();

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getMe = async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const logout = async (req, res) => {
    try {
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                online: false,
                lastSeen: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};