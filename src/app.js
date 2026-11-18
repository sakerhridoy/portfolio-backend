import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import config from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';
import { globalLimiter } from './middleware/rateLimit.js';
import authRoutes from './features/auth/auth.routes.js';
import projectRoutes from './features/projects/project.routes.js';
import leadRoutes from './features/leads/lead.routes.js';
import settingRoutes from './features/settings/setting.routes.js';
import planRoutes from './features/plans/plan.routes.js';
import testimonialRoutes from './features/testimonials/testimonial.routes.js';
import faqRoutes from './features/faqs/faq.routes.js';
import blogRoutes from './features/blog/blogPost.routes.js';
import experienceRoutes from './features/experience/experience.routes.js';
import achievementRoutes from './features/achievements/achievement.routes.js';
import timelineRoutes from './features/timeline/timeline.routes.js';
import resumeRoutes from './features/resume/resume.routes.js';
import uploadRoutes from './features/uploads/upload.routes.js';
import userRoutes from './features/users/user.routes.js';
import chatRoutes from './features/chat/chat.routes.js';
import serviceRoutes from './features/services/service.routes.js';
import digitalProductRoutes from './features/digitalProducts/digitalProduct.routes.js';


function buildCorsOptions() {
  const allowList = config.clientOrigins;
  return {
    origin(origin, callback) {
      // Allow same-origin / non-browser requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowList.includes('*') || allowList.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
}

/**
 * Build and configure the express application. No network side effects here.
 */
export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(mongoSanitize());

  const publicFormLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many submissions, please try again later.' },
  });

  app.use(cors(buildCorsOptions()));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (!config.isTest) {
    app.use(morgan(config.isProd ? 'combined' : 'dev'));
  }

  app.use(globalLimiter);

  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/settings', settingRoutes);
  app.use('/api/plans', planRoutes);
  app.use('/api/testimonials', testimonialRoutes);
  app.use('/api/faqs', faqRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/experience', experienceRoutes);
  app.use('/api/achievements', achievementRoutes);
  app.use('/api/timeline', timelineRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/digital-products', digitalProductRoutes);

  app.use('/api/services', serviceRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
