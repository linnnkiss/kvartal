import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware';
import { parserRateLimiter } from '../../middleware/rateLimiter.middleware';
import * as parserController from './parser.controller';

export const parserRouter = Router();

parserRouter.post('/run', authMiddleware, adminMiddleware, parserRateLimiter, parserController.runParser);
