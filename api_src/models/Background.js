import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const BackgroundSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    page: { type: String, ref: 'Page', required: true, index: true },
    source: { type: String },
    type: { type: String }, // color, gradient, img, video
    opacity: { type: String }
}, tsOpts);

applyToJSON(BackgroundSchema, 'background_id');

export default mongoose.model('Background', BackgroundSchema);