import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const AnalyticsSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    page_id: { type: String, ref: 'Page', index: true },
    block_id: { type: String, ref: 'Block', index: true },
    event: { type: String, enum: ['view', 'click'], required: true },
    continent: { type: String },
    country: { type: String },
    region: { type: String },
    city: { type: String },
    lat: { type: String },
    lon: { type: String },
    created_at: { type: Date, default: Date.now }
}, tsOpts);

applyToJSON(AnalyticsSchema, 'analytics_id');

export default mongoose.model('Analytics', AnalyticsSchema);