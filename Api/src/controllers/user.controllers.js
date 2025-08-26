import User from '../models/User.js';

// Update user by ID
export const updateUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
        if (!user) return res.status(404).json({ error: 'not_found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};

// Delete user by ID
export const deleteUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ error: 'not_found' });
        res.json({ message: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};