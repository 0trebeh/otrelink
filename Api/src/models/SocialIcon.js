import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const SocialIconSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    page: { type: String, ref: 'Page', required: true, index: true },
    icon: { type: String },
    url: { type: String }
}, tsOpts);

applyToJSON(SocialIconSchema, 'icon_id');

export default mongoose.model('SocialIcon', SocialIconSchema);