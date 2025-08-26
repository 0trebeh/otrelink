import Block from '../models/Block.js';

// Create a new block 
export const createBlock = async (req, res) => {
    try {
        const { userId } = req.user;
        const { pageId, position, type, content, is_animate, is_public, is_active } = req.body;

        const block = await Block.create({
            user: userId,
            page_id: pageId,
            position,
            type,
            content,
            is_animate,
            is_public,
            is_active
        });

        res.status(201).json({ block });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get all blocks by user
export const getBlocks = async (req, res) => {
    try {
        const { userId } = req.user;
        const blocks = await Block.find({ user: userId });
        if (!blocks || blocks.length === 0) {
            return res.status(404).json({ error: 'blocks_not_found' });
        }
        res.json({ blocks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get a specific block by ID
export const getBlockById = async (req, res) => {
    try {
        const { id } = req.params;
        const block = await Block.findById(id);
        if (!block) {
            return res.status(404).json({ error: 'block_not_found' });
        }
        res.json({ block });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

//Update a block by Id
export const updateBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { position, content, is_animate, is_public, is_active } = req.body;

        const block = await Block.findByIdAndUpdate(id, { position, content, is_animate, is_public, is_active }, { new: true });
        if (!block) {
            return res.status(404).json({ error: 'block_not_found' });
        }
        res.json({ block });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Delete a block by ID
export const deleteBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const block = await Block.findByIdAndDelete(id);
        if (!block) {
            return res.status(404).json({ error: 'block_not_found' });
        }
        res.json({ message: 'block_deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};