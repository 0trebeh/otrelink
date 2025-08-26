import BlockTypes from '../models/BlockType.js';

// Create a new block type
export const createBlockType = async (req, res) => {
    try {
        const blockType = await BlockTypes.create(req.body);
        res.status(201).json(blockType);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'bad_request' });
    }
};

// Get all block types
export const getAllBlockTypes = async (req, res) => {
    try {
        const blockTypes = await BlockTypes.find();
        res.json(blockTypes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Update a block type by ID
export const updateBlockTypeById = async (req, res) => {
    try {
        const { blockTypeId } = req.params;
        const blockType = await BlockTypes.findByIdAndUpdate(blockTypeId, req.body, { new: true });
        if (!blockType) return res.status(404).json({ error: 'not_found' });
        res.json(blockType);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Delete a block type by ID
export const deleteBlockTypeById = async (req, res) => {
    try {
        const { blockTypeId } = req.params;
        const blockType = await BlockTypes.findByIdAndDelete(blockTypeId);
        if (!blockType) return res.status(404).json({ error: 'not_found' });
        res.json({ message: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};