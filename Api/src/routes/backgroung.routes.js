import { Router } from 'express';
import {
    createBackground,
    getBackgroundById,
    deleteBackgroundById
} from '../controllers/background.controllers.js';

const router = Router();

router.post('/', createBackground);
router.get('/:id', getBackgroundById);
router.delete('/:id', deleteBackgroundById);

export default router;