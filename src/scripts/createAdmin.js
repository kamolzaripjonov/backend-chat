import User from '../models/User.js';
import {connectDB} from '../config/database.js';
import {PLANS, ROLES} from '../utils/constants.js';

export const createAdmin = async () => {
    try {
        await connectDB();

        const adminData = {
            email: process.env.ADMIN_EMAIL || 'admin@social.media',
            username: process.env.ADMIN_USERNAME || 'codenation',
            password: process.env.ADMIN_PASSWORD || 'codenation2026',
            name: process.env.ADMIN_NAME || 'Codenation Admin'
        };

        const existingAdmin = await User.findOne({
            $or: [{email: adminData.email}, {username: adminData.username}]
        });

        if (existingAdmin) {
            console.log('✅ Admin already exists');
            return;
        }

        const admin = await User.create({
            ...adminData,
            role: ROLES.SUPERADMIN,
            plan: 'PREMIUM_3',
            limits: {
                posts: {used: 0, total: Infinity, remaining: Infinity},
                calls: {used: 0, total: Infinity, remaining: Infinity, maxDuration: Infinity},
                messages: {used: 0, total: Infinity, remaining: Infinity}
            },
            acceptedTerms: true,
            acceptedAt: new Date()
        });

        console.log('✅ SUPERADMIN created:');
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   👤 Username: ${admin.username}`);
        console.log(`   🔑 Role: ${admin.role}`);
        console.log(`   💎 Plan: ${admin.plan} (Unlimited)`);
    } catch (error) {
        console.error('❌ Admin creation error:', error.message);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    await createAdmin();
    process.exit(0);
}
