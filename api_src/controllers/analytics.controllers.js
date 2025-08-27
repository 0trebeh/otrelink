import Analytics from '../models/Analytics.js';

// Create a new analytics event
export const createAnalyticsEvent = async (req, res) => {
    try {
        const { blockId, pageId } = req.params;
        const event = await Analytics.create({ ...req.body, block: blockId, page: pageId });
        res.status(201).json(event);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'bad_request' });
    }
};

// Get analytics events by blockId
export const getAnalyticsEventsByBlock = async (req, res) => {
    try {
        const { blockId } = req.params;
        const events = await Analytics.find({ block: blockId });
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get all analytics events by pageId
export const getAnalyticsEvents = async (req, res) => {
    try {
        const { pageId } = req.params;
        const events = await Analytics.find({ page: pageId });
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};