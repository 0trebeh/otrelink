import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const BlockSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    page_id: { type: String, ref: 'Page', required: true, index: true },
    position: { type: Number, default: 0 },
    type: { type: String, required: true }, // link, text, video, img, map, etc.
    content: { type: mongoose.Schema.Types.Mixed }, // Flexible subdocument
    is_animate: { type: Boolean, default: false },
    is_public: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true }
}, tsOpts);

applyToJSON(BlockSchema, 'block_id');

export default mongoose.model('Block', BlockSchema);