import BgImg from '../models/BgImg.js';

// Insert a new background image
export const createBackgroundImage = async (req, res) => {
    try {
        const { name, source } = req.body;
        const backgroundImage = await BgImg.create({ name, source });
        res.status(201).json(backgroundImage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get all background images
export const getAllBackgroundImages = async (req, res) => {
    try {
        const backgroundImages = await BgImg.find();
        res.json(backgroundImages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get Img by Id
export const getBackgroundImageById = async (req, res) => {
    try {
        const backgroundImage = await BgImg.findById(req.params.id);
        if (!backgroundImage) return res.status(404).json({ error: 'not_found' });
        res.json(backgroundImage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Delete Img by Id
export const deleteBackgroundImageById = async (req, res) => {
    try {
        const backgroundImage = await BgImg.findByIdAndDelete(req.params.id);
        if (!backgroundImage) return res.status(404).json({ error: 'not_found' });
        res.json({ message: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};