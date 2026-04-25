import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { config } from '../../config';

export async function register(data: { email: string; name: string; password: string; phone?: string }) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw Object.assign(new Error('Email уже зарегистрирован'), { status: 409 });

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { ...data, password: hashedPassword },
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, createdAt: true },
  });

  const token = signToken(user.id, user.email, user.role);
  return { user, token };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Неверный email или пароль'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Неверный email или пароль'), { status: 401 });

  const { password: _, ...safeUser } = user;
  const token = signToken(user.id, user.email, user.role);
  return { user: safeUser, token };
}

function signToken(id: string, email: string, role: string) {
  return jwt.sign({ id, email, role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
}
