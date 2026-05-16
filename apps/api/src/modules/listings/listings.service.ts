import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { listingQuerySchema, createListingSchema, updateListingSchema } from './listings.schemas';

type ListingQuery = z.infer<typeof listingQuerySchema>;

const AUTHOR_SELECT = { id: true, name: true, phone: true, email: true } as const;
const PARSER_SOURCE_NAMES = ['yandex', 'avito', 'csv-import'] as const;

function buildListingWhere(query: ListingQuery) {
  const { city, district, dealType, propertyType, rooms, priceMin, priceMax, areaMin, areaMax, search, showAll } = query;

  const where: Prisma.ListingWhereInput = {
    sourceName: { in: [...PARSER_SOURCE_NAMES] },
  };

  if (!showAll) where.isHidden = false;
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (district) where.district = { contains: district, mode: 'insensitive' };
  if (dealType) where.dealType = dealType;
  if (propertyType) where.propertyType = propertyType;
  if (rooms !== undefined) where.rooms = rooms;

  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) (where.price as Prisma.FloatFilter).gte = priceMin;
    if (priceMax !== undefined) (where.price as Prisma.FloatFilter).lte = priceMax;
  }

  if (areaMin !== undefined || areaMax !== undefined) {
    where.area = {};
    if (areaMin !== undefined) (where.area as Prisma.FloatNullableFilter).gte = areaMin;
    if (areaMax !== undefined) (where.area as Prisma.FloatNullableFilter).lte = areaMax;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function getListings(query: ListingQuery) {
  const { sortBy, page, limit } = query;
  const where = buildListingWhere(query);

  const orderByMap: Record<string, Prisma.ListingOrderByWithRelationInput> = {
    price_asc: { price: 'asc' },
    price_desc: { price: 'desc' },
    date_asc: { publishedAt: 'asc' },
    date_desc: { publishedAt: 'desc' },
  };

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: orderByMap[sortBy],
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: AUTHOR_SELECT } },
    }),
    prisma.listing.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAvailableCities(query: ListingQuery) {
  const where = buildListingWhere({ ...query, city: undefined, page: 1, limit: 50 });
  const rows = await prisma.listing.findMany({
    where,
    distinct: ['city'],
    select: { city: true },
    orderBy: { city: 'asc' },
  });

  return rows.map((row) => row.city).filter(Boolean);
}

export async function getListingById(id: string, includeHidden = false) {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      sourceName: { in: [...PARSER_SOURCE_NAMES] },
      ...(includeHidden ? {} : { isHidden: false }),
    },
    include: { author: { select: AUTHOR_SELECT } },
  });
  if (!listing) throw Object.assign(new Error('Объявление не найдено'), { status: 404 });
  return listing;
}

export async function createListing(data: z.infer<typeof createListingSchema>, authorId: string) {
  return prisma.listing.create({
    data: { ...data, authorId },
    include: { author: { select: AUTHOR_SELECT } },
  });
}

export async function updateListing(id: string, data: z.infer<typeof updateListingSchema>, userId: string, role: string) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw Object.assign(new Error('Объявление не найдено'), { status: 404 });
  if (listing.authorId !== userId && role !== 'admin') throw Object.assign(new Error('Доступ запрещён'), { status: 403 });
  return prisma.listing.update({ where: { id }, data });
}

export async function deleteListing(id: string, userId: string, role: string) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw Object.assign(new Error('Объявление не найдено'), { status: 404 });
  if (listing.authorId !== userId && role !== 'admin') throw Object.assign(new Error('Доступ запрещён'), { status: 403 });
  await prisma.listing.delete({ where: { id } });
}

export async function getAllListingsAdmin() {
  return prisma.listing.findMany({
    where: { sourceName: { in: [...PARSER_SOURCE_NAMES] } },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: AUTHOR_SELECT } },
  });
}

export async function getStats() {
  const [total, rent, sale, hidden] = await Promise.all([
    prisma.listing.count({ where: { sourceName: { in: [...PARSER_SOURCE_NAMES] } } }),
    prisma.listing.count({ where: { sourceName: { in: [...PARSER_SOURCE_NAMES] }, dealType: 'rent' } }),
    prisma.listing.count({ where: { sourceName: { in: [...PARSER_SOURCE_NAMES] }, dealType: 'sale' } }),
    prisma.listing.count({ where: { sourceName: { in: [...PARSER_SOURCE_NAMES] }, isHidden: true } }),
  ]);
  const usersCount = await prisma.user.count();
  return { total, rent, sale, hidden, users: usersCount };
}
