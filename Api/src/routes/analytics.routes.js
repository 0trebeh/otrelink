import { Router } from 'express';
import {
    createAnalyticsEvent,
    getAnalyticsEventsByBlock,
    getAnalyticsEvents
} from '../controllers/analytics.controllers.js';

const router = Router();

router.post('/event/:blockId/:pageId', createAnalyticsEvent);
router.get('/events_block/:blockId', getAnalyticsEventsByBlock);
router.get('/events_page/:pageId', getAnalyticsEvents);

export default router;