import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const IconSvgSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    name: { type: String, required: true, unique: true },
    svg: { type: String }
}, tsOpts);

applyToJSON(IconSvgSchema, 'iconsvg_id');

export default mongoose.model('IconSvg', IconSvgSchema);