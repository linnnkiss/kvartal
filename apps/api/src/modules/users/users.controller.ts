import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as usersService from './users.service';
import { z } from 'zod';

const updateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getMe(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function getMyListings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listings = await usersService.getMyListings(req.user!.id);
    res.json(listings);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateMeSchema.parse(req.body);
    const user = await usersService.updateMe(req.user!.id, data);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
