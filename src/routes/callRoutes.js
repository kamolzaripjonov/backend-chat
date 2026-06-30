import express from 'express';
import {startCall, endCall, getCallHistory} from '../controller/callController.js';
import {protect} from '../middleware/auth.js';
import {checkLimit} from '../middleware/checkLimit.js';

const router = express.Router();

router.post('/start', protect, checkLimit('call'), startCall);
router.post('/end', protect, endCall);
router.get('/history/:userId', protect, getCallHistory);

export default router;