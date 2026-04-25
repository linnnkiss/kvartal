import { Router } from 'express';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, authController.register);
authRouter.post('/login', authRateLimiter, authController.login);
