import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './lib/db.js';

import analyticsRoutes from './routes/analytics.routes.js';
import authRoutes from './routes/auth.routes.js';
import backgroundRoutes from './routes/backgroung.routes.js';
import bgImgRoutes from './routes/bgImg.routes.js';
import blockRoutes from './routes/block.routes.js';
import blockStyleRoutes from './routes/blockStyle.routes.js';
import blockTypesRoutes from './routes/blockTypes.routes.js';
import iconSvgRoutes from './routes/iconSvg.routes.js';
import pageRoutes from './routes/page.routes.js';
import rolRoutes from './routes/rol.routes.js';
import socialIconRoutes from './routes/socialIcon.routes.js';
import textStyleRoutes from './routes/textStyle.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// Basic security & middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/analytics', analyticsRoutes);
app.use('/auth', authRoutes);
app.use('/background', backgroundRoutes);
app.use('/bgImg', bgImgRoutes);
app.use('/block', blockRoutes);
app.use('/blockStyle', blockStyleRoutes);
app.use('/blockTypes', blockTypesRoutes);
app.use('/iconSvg', iconSvgRoutes);
app.use('/page', pageRoutes);
app.use('/rol', rolRoutes);
app.use('/socialIcon', socialIconRoutes);
app.use('/textStyle', textStyleRoutes);
app.use('/user', userRoutes);

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
});