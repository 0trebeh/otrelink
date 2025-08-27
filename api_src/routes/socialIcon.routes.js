import { Router } from 'express';
import {
    createSocialIcon,
    getSocialIconsByPage,
    updateSocialIconById,
    deleteSocialIconById
} from '../controllers/SocialIcon.controllers.js';

const router = Router();

router.post('/:PageId', createSocialIcon);
router.get('/:PageId', getSocialIconsByPage);
router.put('/:PageId/:id', updateSocialIconById);
router.delete('/:PageId/:id', deleteSocialIconById);

export default router;
