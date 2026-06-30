export const checkLimit = (type) => {
    return async (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({success: false, message: 'Please login first'});
        }

        if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
            return next();
        }

        const limitMap = {
            'post': 'posts',
            'call': 'calls',
            'message': 'messages'
        };

        const limitKey = limitMap[type];
        if (!limitKey) return next();

        if (user.limits[limitKey]?.remaining <= 0) {
            return res.status(403).json({
                success: false,
                message: `${type} limit reached. Please upgrade to Premium!`,
                plan: user.plan,
                remaining: user.limits[limitKey]?.remaining || 0
            });
        }

        next();
    };
};