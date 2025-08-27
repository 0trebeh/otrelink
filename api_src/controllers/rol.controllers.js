import Rol from '../models/Rol.js';

// Create Rol
export const createRol = async (req, res) => {
    try {
        const rol = await Rol.create(req.body);
        res.status(201).json(rol);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'bad_request' });
    }
};

// Get all Rols
export const getAllRols = async (req, res) => {
    try {
        const rols = await Rol.find();
        res.json(rols);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};
