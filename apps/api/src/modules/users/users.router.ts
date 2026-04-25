import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as usersController from './users.controller';

export const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get('/', usersController.getMe);
usersRouter.patch('/', usersController.updateMe);
usersRouter.get('/listings', usersController.getMyListings);
