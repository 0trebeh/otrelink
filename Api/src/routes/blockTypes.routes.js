import { Router } from 'express';
import {
    createBlockType,
    getAllBlockTypes,
    updateBlockTypeById,
    deleteBlockTypeById
} from '../controllers/blockTypes.controllers.js';

const router = Router();

router.post('/', createBlockType);
router.get('/', getAllBlockTypes);
router.put('/:blockTypeId', updateBlockTypeById);
router.delete('/:blockTypeId', deleteBlockTypeById);

export default router;
