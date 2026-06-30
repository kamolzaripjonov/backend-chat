import express from 'express';
import {getUserProfile, getMyProfile, updateProfile, getMyLimits, searchUsers} from '../controller/userController.js';
import {protect} from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateProfile);
router.get('/me/limits', protect, getMyLimits);
router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserProfile);

export default router;