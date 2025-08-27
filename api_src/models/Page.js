import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const PageSchema = new mongoose.Schema({
    _id: { type: String, default: uuid }, // UUID PK
    user: { type: String, ref: 'User', required: true, index: true },
    page_name: { type: String, unique: true, index: true },
    profile_img: { type: String },
    description: { type: String },
    bg_img: { type: String },
    verified: { type: Boolean, default: false },
    is_public: { type: Boolean, default: true },
    is_icons_up: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, tsOpts);

applyToJSON(PageSchema, 'page_id');

export default mongoose.model('Page', PageSchema);