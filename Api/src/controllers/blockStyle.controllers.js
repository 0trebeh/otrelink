import BlockStyle from '../models/BlockStyle.js';

// Create a new block style
export const createBlockStyle = async (req, res) => {
    try {
        const { blockId } = req.params;
        const blockStyle = await BlockStyle.create({ ...req.body, block: blockId });
        res.status(201).json(blockStyle);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'bad_request' });
    }
};

// Get block style by Pageid
export const getBlockStyleByPage = async (req, res) => {
    try {
        const { pageId } = req.params;
        const blockStyle = await BlockStyle.findOne({ page: pageId });
        if (!blockStyle) return res.status(404).json({ error: 'not_found' });
        res.json(blockStyle);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Update block style by PageId
export const updateBlockStyleByPage = async (req, res) => {
    try {
        const { pageId } = req.params;
        const blockStyle = await BlockStyle.findOneAndUpdate({ page: pageId }, req.body, { new: true });
        if (!blockStyle) return res.status(404).json({ error: 'not_found' });
        res.json(blockStyle);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Delete block style by blockStyleId
export const deleteBlockStyleByBlock = async (req, res) => {
    try {
        const { blockStyleId } = req.params;
        const blockStyle = await BlockStyle.findOneAndDelete({ _id: blockStyleId });
        if (!blockStyle) return res.status(404).json({ error: 'not_found' });
        res.json({ message: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};