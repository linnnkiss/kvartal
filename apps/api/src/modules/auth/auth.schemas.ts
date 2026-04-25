import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  name: z.string().min(2, 'Имя минимум 2 символа').max(100),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
