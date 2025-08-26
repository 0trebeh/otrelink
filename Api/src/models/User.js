import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const UserSchema = new mongoose.Schema({
    _id: { type: String, default: uuid }, // UUID primary key
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String },
    name: { type: String },
    role: { type: String },
    region_name: { type: String },
    lat: { type: String },
    lon: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, tsOpts);

applyToJSON(UserSchema, 'user_id');

export default mongoose.model('User', UserSchema);