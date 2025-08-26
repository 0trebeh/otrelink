import { Router } from 'express';
import {
    createBlockStyle,
    getBlockStyleByPage,
    updateBlockStyleByPage,
    deleteBlockStyleByBlock
} from '../controllers/blockStyle.controllers.js';

const router = Router();

router.post('/:blockId', createBlockStyle);
router.get('/:pageId', getBlockStyleByPage);
router.put('/:pageId', updateBlockStyleByPage);
router.delete('/:blockStyleId', deleteBlockStyleByBlock);

export default router;
