import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const RolSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    name: { type: String, required: true },
    level: { type: Number, required: true }
}, tsOpts);

applyToJSON(RolSchema, 'rol_id');

export default mongoose.model('Rol', RolSchema);