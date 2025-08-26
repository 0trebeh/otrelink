import Background from '../models/Background.js';

// Insert a new background
export const createBackground = async (req, res) => {
    try {
        const { page, source, type, opacity } = req.body;
        const background = await Background.create({ page, source, type, opacity });
        res.status(201).json(background);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get Background by Id
export const getBackgroundById = async (req, res) => {
    try {
        const background = await Background.findById(req.params.id);
        if (!background) return res.status(404).json({ error: 'not_found' });
        res.json(background);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Delete Background by Id
export const deleteBackgroundById = async (req, res) => {
    try {
        const background = await Background.findByIdAndDelete(req.params.id);
        if (!background) return res.status(404).json({ error: 'not_found' });
        res.json({ message: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};