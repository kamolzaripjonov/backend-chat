import express from 'express';
import {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    toggleLike,
    toggleSave,
    sharePost,
    getSavedPosts
} from '../controller/postController.js';
import {protect} from '../middleware/auth.js';
import {checkLimit} from '../middleware/checkLimit.js';

const router = express.Router();

router.post('/', protect, checkLimit('post'), createPost);
router.get('/', protect, getPosts);
router.get('/saved', protect, getSavedPosts);
router.get('/:postId', protect, getPostById);
router.put('/:postId', protect, updatePost);
router.delete('/:postId', protect, deletePost);

router.put('/:postId/like', protect, toggleLike);
router.put('/:postId/save', protect, toggleSave);
router.post('/:postId/share', protect, sharePost);

export default router;