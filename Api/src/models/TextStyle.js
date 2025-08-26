import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const TextStyleSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    page: { type: String, ref: 'Page', required: true, index: true },
    color: { type: String },
    shadow: { type: String },
    text_size: { type: Number, default: 0 }
}, tsOpts);

applyToJSON(TextStyleSchema, 'textstyle_id');

export default mongoose.model('TextStyle', TextStyleSchema);