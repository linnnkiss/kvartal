import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as favoritesService from './favorites.service';

export async function getFavorites(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listings = await favoritesService.getFavorites(req.user!.id);
    res.json(listings);
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await favoritesService.addFavorite(req.user!.id, req.params.listingId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeFavorite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await favoritesService.removeFavorite(req.user!.id, req.params.listingId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getFavoriteIds(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ids = await favoritesService.getFavoriteIds(req.user!.id);
    res.json(ids);
  } catch (err) {
    next(err);
  }
}
