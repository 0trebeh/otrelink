import Page from '../models/Page.js';

// Create a page for the authenticated user
export const createPage = async (req, res) => {
    try {
        const { page_name, description, profile_img, bg_img } = req.body;
        const { userId } = req.user;
        const page = await Page.create({ user: userId, page_name, description, profile_img, bg_img });
        res.status(201).json(page);
    } catch (err) {
        if (err?.code === 11000) return res.status(409).json({ error: 'page_name already exists' });
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Get my pages
export const getMyPages = async (req, res) => {
    const pages = await Page.find({ user: req.user.userId }).sort({ created_at: -1 });
    res.json(pages);
};

// Get public page by page_name (no auth)
export const getPublicPage = async (req, res) => {
    const page = await Page.findOne({ page_name: req.params.page_name, public: true });
    if (!page) return res.status(404).json({ error: 'not_found' });
    res.json(page);
};

// Update a page (owner only)
export const updatePage = async (req, res) => {
    const page = await Page.findById(req.params.pageId);
    if (!page) return res.status(404).json({ error: 'page_not_found' });
    if (page.user !== req.user.userId) return res.status(403).json({ error: 'forbidden' });

    const { page_name, description, profile_img, bg_img, is_public, is_icons_up } = req.body;
    Object.assign(page, { page_name, description, profile_img, bg_img, is_public, is_icons_up });
    await page.save();
    res.json(page);
};

// Delete a page (owner only)
export const deletePage = async (req, res) => {
    const page = await Page.findById(req.params.pageId);
    if (!page) return res.status(404).json({ error: 'page_not_found' });
    if (page.user !== req.user.userId) return res.status(403).json({ error: 'forbidden' });

    await page.remove();
    res.json({ message: 'page_deleted' });
};