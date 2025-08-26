import mongoose from 'mongoose';
import { uuid } from '../lib/id.js';
import { tsOpts, applyToJSON } from './_base.js';

const BgImgSchema = new mongoose.Schema({
    _id: { type: String, default: uuid },
    source: { type: String }
}, tsOpts);

applyToJSON(BgImgSchema, 'bgimg_id');

export default mongoose.model('BgImg', BgImgSchema);