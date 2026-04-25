import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const status = (err as any).status ?? 500;

  if (status < 500) {
    logger.debug(err.message);
  } else {
    logger.error(`${err.message}\n${err.stack}`);
  }

  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Ошибка валидации', errors: err.flatten().fieldErrors });
    return;
  }

  res.status(status).json({ message: err.message || 'Внутренняя ошибка сервера' });
}
