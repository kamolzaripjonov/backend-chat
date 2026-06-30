import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import {PLANS} from '../utils/constants.js';

export const upgradePlan = async (req, res) => {
    try {
        const {plan, paymentMethod, transactionId} = req.body;

        if (!['PREMIUM_1', 'PREMIUM_2', 'PREMIUM_3'].includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan'
            });
        }

        const planData = PLANS[plan];
        const user = await User.findById(req.user._id);

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        const subscription = await Subscription.create({
            user: req.user._id,
            plan,
            price: planData.price,
            currency: planData.currency,
            endDate: expiryDate,
            paymentMethod,
            transactionId,
            isActive: true
        });

        user.plan = plan;
        user.planExpiry = expiryDate;
        user.limits.posts.total = planData.posts;
        user.limits.calls.total = planData.calls;
        user.limits.calls.maxDuration = planData.callDuration;
        user.limits.messages.total = planData.messages;

        user.limits.posts.used = 0;
        user.limits.calls.used = 0;
        user.limits.messages.used = 0;

        user.limits.posts.remaining = planData.posts;
        user.limits.calls.remaining = planData.calls;
        user.limits.messages.remaining = planData.messages;

        await user.save();

        res.json({
            success: true,
            message: `Plan upgraded to ${plan} successfully`,
            data: {
                plan: user.plan,
                expiry: user.planExpiry,
                limits: user.limits,
                subscription
            }
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getPlans = async (req, res) => {
    try {
        const plans = Object.entries(PLANS).map(([key, value]) => ({
            id: key,
            name: key,
            posts: value.posts === Infinity ? '∞' : value.posts,
            calls: value.calls === Infinity ? '∞' : value.calls,
            callDuration: value.callDuration === Infinity ? '∞' : `${value.callDuration} min`,
            messages: value.messages === Infinity ? '∞' : value.messages,
            price: value.price,
            currency: value.currency
        }));

        res.json({
            success: true,
            plans
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const getSubscriptionHistory = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({
            user: req.user._id
        }).sort({createdAt: -1});

        res.json({
            success: true,
            count: subscriptions.length,
            subscriptions
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};