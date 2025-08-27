import IconSvg from '../models/IconSvg.js';

// Insert a new icon SVG
export const createIconSvg = async (req, res) => {
    try {
        const { name, svg } = req.body;
        const iconSvg = await IconSvg.create({ name, svg });
        res.status(201).json(iconSvg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get all icon SVGs
export const getAllIconSvgs = async (req, res) => {
    try {
        const iconSvgs = await IconSvg.find();
        res.json(iconSvgs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get Icon by Id
export const getIconSvgById = async (req, res) => {
    try {
        const iconSvg = await IconSvg.findById(req.params.id);
        if (!iconSvg) return res.status(404).json({ error: 'not_found' });
        res.json(iconSvg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};