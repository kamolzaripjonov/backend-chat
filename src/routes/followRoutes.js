import express from 'express';
import {
    followUser,
    unfollowUser,
    checkFollowStatus,
    getFollowers,
    getFollowing,
    acceptFollowRequest,
    rejectFollowRequest,
    getFollowRequests
} from '../controller/followController.js';
import {protect} from '../middleware/auth.js';

const router = express.Router();

router.post('/:userId/follow', protect, followUser);
router.delete('/:userId/unfollow', protect, unfollowUser);
router.get('/:userId/status', protect, checkFollowStatus);
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);
router.get('/requests', protect, getFollowRequests);
router.put('/requests/:followId/accept', protect, acceptFollowRequest);
router.delete('/requests/:followId/reject', protect, rejectFollowRequest);

export default router;