import express from 'express';
import {
    addComment,
    getComments,
    updateComment,
    deleteComment,
    toggleCommentLike,
    replyToComment
} from '../controller/commentController.js';
import {protect} from '../middleware/auth.js';

const router = express.Router();

router.post('/:postId', protect, addComment);
router.get('/:postId', protect, getComments);
router.put('/:commentId', protect, updateComment);
router.delete('/:commentId', protect, deleteComment);
router.put('/:commentId/like', protect, toggleCommentLike);
router.post('/:commentId/reply', protect, replyToComment);

export default router;