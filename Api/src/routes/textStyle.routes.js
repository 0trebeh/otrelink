import { Router } from 'express';
import {
    createTextStyle,
    getTextStylesByPage,
    updateTextStyleById,
    deleteTextStyleById
} from '../controllers/TextStyle.controllers.js';

const router = Router();

router.post('/:PageId', createTextStyle);
router.get('/:PageId', getTextStylesByPage);
router.put('/:PageId/text-styles/:id', updateTextStyleById);
router.delete('/:PageId/text-styles/:id', deleteTextStyleById);

export default router;
