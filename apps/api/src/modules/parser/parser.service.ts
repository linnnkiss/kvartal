import { prisma } from '../../lib/prisma';
import { ParsedListing } from './parsers/base.parser';
import { DemoParser } from './parsers/demo.parser';
import { CsvParser } from './parsers/csv.parser';
import { logger } from '../../lib/logger';

interface RunParserOptions {
  source?: 'demo' | 'csv';
  limit?: number;
  city?: string;
  dealType?: 'rent' | 'sale';
}

export async function runParser(options: RunParserOptions = {}) {
  const { source = 'demo', limit = 20, city, dealType } = options;

  const parser = source === 'csv' ? new CsvParser() : new DemoParser();
  const listings = await parser.run({ limit, city, dealType });

  if (listings.length === 0) {
    return { saved: 0, skipped: 0, total: 0, message: 'Парсер не вернул данных' };
  }

  const result = await saveListings(listings);
  return { ...result, total: listings.length, source: parser.sourceName };
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
