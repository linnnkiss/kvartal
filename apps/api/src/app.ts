import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { rateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/error.middleware';
import { authRouter } from './modules/auth/auth.router';
import { listingsRouter } from './modules/listings/listings.router';
import { favoritesRouter } from './modules/favorites/favorites.router';
import { usersRouter } from './modules/users/users.router';
import { parserRouter } from './modules/parser/parser.router';

export function createApp() {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan(config.isDev ? 'dev' : 'combined'));
  app.use(rateLimiter);

  app.use('/api/auth', authRouter);
  app.use('/api/listings', listingsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/me', usersRouter);
  app.use('/api/parser', parserRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'kvartal-api', timestamp: new Date().toISOString() });
  });

  app.use(errorHandler);

  return app;
}
