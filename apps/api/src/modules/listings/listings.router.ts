import { Router } from 'express';
import { authMiddleware, adminMiddleware, optionalAuth } from '../../middleware/auth.middleware';
import * as listingsController from './listings.controller';

export const listingsRouter = Router();

listingsRouter.get('/', optionalAuth, listingsController.getListings);
listingsRouter.get('/admin/all', authMiddleware, adminMiddleware, listingsController.getAdminListings);
listingsRouter.get('/admin/stats', authMiddleware, adminMiddleware, listingsController.getStats);
listingsRouter.get('/:id', listingsController.getListingById);
listingsRouter.post('/', authMiddleware, listingsController.createListing);
listingsRouter.patch('/:id', authMiddleware, listingsController.updateListing);
listingsRouter.delete('/:id', authMiddleware, listingsController.deleteListing);
