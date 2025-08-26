import { Router } from 'express';
import { createRol, getAllRols } from '../controllers/rol.controllers.js';

const router = Router();

router.post('/', createRol);
router.get('/', getAllRols);

export default router;
