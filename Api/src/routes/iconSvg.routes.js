import { Router } from 'express';
import {
    createIconSvg,
    getAllIconSvgs,
    getIconSvgById
} from '../controllers/iconSvg.controllers.js';

const router = Router();

router.post('/', createIconSvg);
router.get('/', getAllIconSvgs);
router.get('/:id', getIconSvgById);

export default router;
