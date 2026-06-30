import express from 'express';
import {
    getAllUsers,
    getUserDetails,
    updateUserRole,
    updateUserPlan,
    deleteUser
} from '../controller/adminController.js';
import {protect} from '../middleware/auth.js';
import {restrictTo} from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/users', protect, restrictTo('ADMIN', 'SUPERADMIN'), getAllUsers);
router.get('/users/:id', protect, restrictTo('ADMIN', 'SUPERADMIN'), getUserDetails);
router.put('/users/:id/role', protect, restrictTo('ADMIN', 'SUPERADMIN'), updateUserRole);
router.put('/users/:id/plan', protect, restrictTo('ADMIN', 'SUPERADMIN'), updateUserPlan);
router.delete('/users/:id', protect, restrictTo('ADMIN', 'SUPERADMIN'), deleteUser);

export default router;