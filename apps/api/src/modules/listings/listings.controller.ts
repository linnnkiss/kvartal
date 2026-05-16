import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { listingQuerySchema, createListingSchema, updateListingSchema } from './listings.schemas';
import * as listingsService from './listings.service';

export async function getListings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = listingQuerySchema.parse(req.query);
    if (query.showAll && req.user?.role !== 'admin') delete query.showAll;
    const result = await listingsService.getListings(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getListingById(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await listingsService.getListingById(req.params.id);
    res.json(listing);
  } catch (err) {
    next(err);
  }
}

export async function getAvailableCities(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = listingQuerySchema.parse(req.query);
    if (query.showAll && req.user?.role !== 'admin') delete query.showAll;
    const cities = await listingsService.getAvailableCities(query);
    res.json(cities);
  } catch (err) {
    next(err);
  }
}

export async function createListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createListingSchema.parse(req.body);
    const listing = await listingsService.createListing(data, req.user!.id);
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
}

export async function updateListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateListingSchema.parse(req.body);
    const listing = await listingsService.updateListing(req.params.id, data, req.user!.id, req.user!.role);
    res.json(listing);
  } catch (err) {
    next(err);
  }
}

export async function deleteListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await listingsService.deleteListing(req.params.id, req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getAdminListings(req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await listingsService.getAllListingsAdmin();
    res.json(listings);
  } catch (err) {
    next(err);
  }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await listingsService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
