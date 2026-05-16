import { prisma } from '../../lib/prisma';
import { ParsedListing } from './parsers/base.parser';
import { CsvParser } from './parsers/csv.parser';
import { AvitoParser } from './parsers/avito.parser';
import { YandexRealtyParser } from './parsers/yandex.parser';
import { logger } from '../../lib/logger';

interface RunParserOptions {
  source?: 'csv' | 'avito' | 'yandex';
  limit?: number;
  city?: string;
  dealType?: 'rent' | 'sale';
}

export async function runParser(options: RunParserOptions = {}) {
  const { source = 'yandex', limit = 20, city, dealType } = options;

  let parser;
  if (source === 'csv') parser = new CsvParser();
  else if (source === 'avito') parser = new AvitoParser();
  else parser = new YandexRealtyParser();

  const parserRun = await prisma.parserRun.create({
    data: {
      source: parser.sourceName,
      city,
      dealType,
      requestedLimit: limit,
      status: 'running',
    },
  });

  try {
    const listings = await parser.run({ limit, city, dealType });

    if (listings.length === 0) {
      const message = 'lastError' in parser && parser.lastError
        ? parser.lastError
        : 'Парсер не вернул данных';
      const result = { saved: 0, skipped: 0, total: 0, source: parser.sourceName, message };

      await prisma.parserRun.update({
        where: { id: parserRun.id },
        data: {
          ...result,
          status: 'empty',
          finishedAt: new Date(),
        },
      });

      return result;
    }

    const result = await saveListings(listings);
    const response = { ...result, total: listings.length, source: parser.sourceName };

    await prisma.parserRun.update({
      where: { id: parserRun.id },
      data: {
        ...response,
        status: result.saved > 0 ? 'success' : 'skipped',
        message: result.saved > 0 ? null : 'Все найденные объявления уже были импортированы или пропущены',
        finishedAt: new Date(),
      },
    });

    return response;
  } catch (err) {
    const message = (err as Error).message || 'Ошибка парсера';
    await prisma.parserRun.update({
      where: { id: parserRun.id },
      data: {
        status: 'failed',
        message,
        finishedAt: new Date(),
      },
    });
    throw err;
  }
}

export async function getParserRuns(limit = 10) {
  return prisma.parserRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
}

async function saveListings(listings: ParsedListing[]) {
  let saved = 0;
  let skipped = 0;

  for (const item of listings) {
    try {
      const exists = await prisma.listing.findUnique({ where: { sourceUrl: item.sourceUrl } });
      if (exists) {
        skipped++;
        continue;
      }

      await prisma.listing.create({
        data: {
          title: item.title,
          description: item.description,
          price: item.price,
          currency: item.currency,
          city: item.city,
          address: item.address,
          district: item.district,
          rooms: item.rooms ?? null,
          area: item.area ?? null,
          floor: item.floor ?? null,
          totalFloors: item.totalFloors ?? null,
          propertyType: item.propertyType,
          dealType: item.dealType,
          images: item.images,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          publishedAt: item.publishedAt,
        },
      });
      saved++;
    } catch (err) {
      logger.error(`Parser save error: ${(err as Error).message}`);
      skipped++;
    }
  }

  logger.info(`Parser: saved=${saved}, skipped=${skipped}`);
  return { saved, skipped };
}
