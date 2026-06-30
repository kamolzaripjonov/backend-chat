import express from 'express';
import {upgradePlan, getPlans, getSubscriptionHistory} from '../controller/paymentController.js';
import {protect} from '../middleware/auth.js';

const router = express.Router();

router.get('/plans', protect, getPlans);
router.post('/upgrade', protect, upgradePlan);
router.get('/history', protect, getSubscriptionHistory);

export default router;