import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const BlockTypesSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    name: { type: String }
}, tsOpts);

applyToJSON(BlockTypesSchema, 'blocktype_id');

export default mongoose.model('BlockTypes', BlockTypesSchema);