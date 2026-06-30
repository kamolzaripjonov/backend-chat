import express from 'express';
import {sendMessage, getMessages, markAsRead} from '../controller/messageController.js';
import {protect} from '../middleware/auth.js';
import {checkLimit} from '../middleware/checkLimit.js';

const router = express.Router();

router.post('/', protect, checkLimit('message'), sendMessage);
router.get('/:userId', protect, getMessages);
router.put('/:messageId/read', protect, markAsRead);

export default router;