import TextStyle from '../models/TextStyle.js';

// Create a new text style
export const createTextStyle = async (req, res) => {
    try {
        const textStyle = await TextStyle.create(req.body);
        res.status(201).json(textStyle);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'bad_request' });
    }
};

// Get text styles by pageId
export const getTextStylesByPage = async (req, res) => {
    try {
        const { PageId } = req.params;
        const textStyles = await TextStyle.find({ page: PageId });
        res.json(textStyles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Update text style by TextStyle ID
export const updateTextStyleById = async (req, res) => {
    try {
        const { id } = req.params;
        const { fontSize, fontFamily, color } = req.body;
        const textStyle = await TextStyle.findByIdAndUpdate(id, { fontSize, fontFamily, color }, { new: true });
        if (!textStyle) return res.status(404).json({ error: 'not_found' });
        res.json(textStyle);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Delete text style by TextStyle ID
export const deleteTextStyleById = async (req, res) => {
    try {
        const { id } = req.params;
        const textStyle = await TextStyle.findByIdAndDelete(id);
        if (!textStyle) return res.status(404).json({ error: 'not_found' });
        res.json({ message: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};