import { z } from 'zod';

export const listingQuerySchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  dealType: z.enum(['rent', 'sale']).optional(),
  propertyType: z.enum(['apartment', 'studio', 'newbuilding', 'room', 'house']).optional(),
  rooms: z.coerce.number().int().min(0).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  areaMin: z.coerce.number().min(0).optional(),
  areaMax: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'date_asc', 'date_desc']).default('date_desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  showAll: z.coerce.boolean().optional(),
});

export const createListingSchema = z.object({
  title: z.string().min(5, 'Минимум 5 символов').max(200),
  description: z.string().min(20, 'Минимум 20 символов'),
  price: z.number().positive('Цена должна быть положительной'),
  currency: z.string().default('RUB'),
  city: z.string().min(1),
  address: z.string().min(5),
  district: z.string().optional(),
  rooms: z.number().int().min(0).optional(),
  area: z.number().positive().optional(),
  floor: z.number().int().min(0).optional(),
  totalFloors: z.number().int().min(1).optional(),
  propertyType: z.enum(['apartment', 'studio', 'newbuilding', 'room', 'house']).default('apartment'),
  dealType: z.enum(['rent', 'sale']).default('sale'),
  images: z.array(z.string()).default([]),
});

export const updateListingSchema = createListingSchema.partial().extend({
  isHidden: z.boolean().optional(),
});
