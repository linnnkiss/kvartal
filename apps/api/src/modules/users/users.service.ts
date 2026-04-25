import { prisma } from '../../lib/prisma';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw Object.assign(new Error('Пользователь не найден'), { status: 404 });
  return user;
}

export async function getMyListings(userId: string) {
  return prisma.listing.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateMe(userId: string, data: { name?: string; phone?: string; avatar?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, updatedAt: true },
  });
}
