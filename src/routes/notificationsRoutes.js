import express from 'express';
import {
    getMyNotifications,
    getRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} from '../controller/notificationController.js';
import {protect} from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.get('/recent', protect, getRecentNotifications);
router.get('/unread/count', protect, getUnreadCount);
router.put('/:notificationId/read', protect, markAsRead);
router.put('/read/all', protect, markAllAsRead);
router.delete('/:notificationId', protect, deleteNotification);

export default router;