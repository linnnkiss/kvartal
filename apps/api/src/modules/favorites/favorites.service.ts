import { prisma } from '../../lib/prisma';

export async function getFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      listing: {
        include: { author: { select: { id: true, name: true, phone: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return favorites.map((f) => f.listing);
}

export async function addFavorite(userId: string, listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw Object.assign(new Error('Объявление не найдено'), { status: 404 });

  await prisma.favorite.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: {},
  });
  return { message: 'Добавлено в избранное' };
}

export async function removeFavorite(userId: string, listingId: string) {
  await prisma.favorite.deleteMany({ where: { userId, listingId } });
  return { message: 'Удалено из избранного' };
}

export async function getFavoriteIds(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { listingId: true },
  });
  return favorites.map((f) => f.listingId);
}
