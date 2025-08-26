import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const BlockStyleSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    page: { type: String, ref: 'Page', required: true, index: true },
    text_size: { type: Number, default: 0 },
    text_color: { type: String },
    bg_color: { type: String },
    border: { type: String },
    shadow: { type: String },
    opacity: { type: String },
    sharelink: { type: Boolean }
}, tsOpts);

applyToJSON(BlockStyleSchema, 'blockstyle_id');

export default mongoose.model('BlockStyle', BlockStyleSchema);