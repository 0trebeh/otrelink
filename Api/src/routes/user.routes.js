import { Router } from 'express';
import { updateUserById, deleteUserById } from '../controllers/user.controllers.js';

const router = Router();

router.put('/:id', updateUserById);
router.delete('/:id', deleteUserById);

export default router;
