import { Router } from 'express';
import { authRequired } from '../middleware/auth.js'
import {
    createPage,
    getMyPages,
    getPublicPage,
    updatePage,
    deletePage
} from '../controllers/page.controllers.js';

const router = Router();

router.post('/', authRequired, createPage);
router.get('/me', authRequired, getMyPages);
router.get('/@/:page_name', getPublicPage);
router.put('/:pageId', authRequired, updatePage);
router.delete('/:pageId', authRequired, deletePage);

export default router;