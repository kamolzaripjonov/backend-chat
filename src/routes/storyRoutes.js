import express from 'express';
import {
    createStory,
    getStories,
    getUserStories,
    viewStory,
    reactToStory,
    deleteStory
} from '../controller/storyController.js';
import {protect} from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createStory);
router.get('/', protect, getStories);
router.get('/user/:userId', protect, getUserStories);
router.put('/:storyId/view', protect, viewStory);
router.put('/:storyId/react', protect, reactToStory);
router.delete('/:storyId', protect, deleteStory);

export default router;