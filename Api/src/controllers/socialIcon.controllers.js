import SocialIcon from '../models/SocialIcon.js';

// Create a new social icon
export const createSocialIcon = async (req, res) => {
    try {
        const { PageId } = req.params;
        const socialIcon = await SocialIcon.create({ ...req.body, page: PageId });
        res.status(201).json(socialIcon);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'bad_request' });
    }
};

// Get social icons by pageId
export const getSocialIconsByPage = async (req, res) => {
    try {
        const { PageId } = req.params;
        const socialIcons = await SocialIcon.find({ page: PageId });
        res.json(socialIcons);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Update social icon by SocialIcon ID
export const updateSocialIconById = async (req, res) => {
    try {
        const { id } = req.params;
        const { position } = req.body;
        const socialIcon = await SocialIcon.findByIdAndUpdate(id, { position }, { new: true });
        if (!socialIcon) return res.status(404).json({ error: 'not_found' });
        res.json(socialIcon);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Delete social icon by SocialIcon ID
export const deleteSocialIconById = async (req, res) => {
    try {
        const { id } = req.params;
        const socialIcon = await SocialIcon.findByIdAndDelete(id);
        if (!socialIcon) return res.status(404).json({ error: 'not_found' });
        res.json({ message: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};