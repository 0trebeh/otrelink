import { Router } from 'express';
import {
    createBackgroundImage,
    getAllBackgroundImages,
    getBackgroundImageById,
    deleteBackgroundImageById
} from '../controllers/bgImg.controllers.js';

const router = Router();

router.post('/', createBackgroundImage);
router.get('/', getAllBackgroundImages);
router.get('/:id', getBackgroundImageById);
router.delete('/:id', deleteBackgroundImageById);

export default router;
