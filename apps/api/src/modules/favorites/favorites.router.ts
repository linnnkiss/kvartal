import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as favoritesController from './favorites.controller';

export const favoritesRouter = Router();

favoritesRouter.use(authMiddleware);

favoritesRouter.get('/', favoritesController.getFavorites);
favoritesRouter.get('/ids', favoritesController.getFavoriteIds);
favoritesRouter.post('/:listingId', favoritesController.addFavorite);
favoritesRouter.delete('/:listingId', favoritesController.removeFavorite);
