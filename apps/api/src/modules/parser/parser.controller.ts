import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as parserService from './parser.service';

const runParserSchema = z.object({
  source: z.enum(['csv', 'avito', 'yandex']).default('yandex'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  city: z.string().optional(),
  dealType: z.enum(['rent', 'sale']).optional(),
});

export async function runParser(req: Request, res: Response, next: NextFunction) {
  try {
    const options = runParserSchema.parse(req.body);
    const result = await parserService.runParser(options);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getParserRuns(_req: Request, res: Response, next: NextFunction) {
  try {
    const runs = await parserService.getParserRuns();
    res.json(runs);
  } catch (err) {
    next(err);
  }
}
