import fs from 'fs';
import path from 'path';
import { ListingParser, ParsedListing, ParserOptions } from './base.parser';

interface CsvRow {
  title?: string;
  description?: string;
  price?: string;
  currency?: string;
  city?: string;
  address?: string;
  district?: string;
  rooms?: string;
  area?: string;
  floor?: string;
  totalFloors?: string;
  propertyType?: string;
  dealType?: string;
  images?: string;
  sourceUrl?: string;
  publishedAt?: string;
  [key: string]: string | undefined;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((v) => v.replace(/^"|"$/g, '').trim());
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });
}

export class CsvParser extends ListingParser {
  readonly sourceName = 'csv-import';
  private filePath: string;

  constructor(filePath?: string) {
    super();
    this.filePath = filePath ?? path.join(process.cwd(), 'src', 'data', 'listings.csv');
  }

  protected async fetchListings(options: ParserOptions): Promise<ParsedListing[]> {
    if (!fs.existsSync(this.filePath)) {
      console.warn(`[${this.sourceName}] CSV файл не найден: ${this.filePath}`);
      console.warn(`[${this.sourceName}] Создайте файл src/data/listings.csv`);
      return [];
    }

    const content = fs.readFileSync(this.filePath, 'utf-8');
    const rows = parseCsv(content);
    const limit = options.limit ?? rows.length;

    const listings: ParsedListing[] = [];

    for (const row of rows.slice(0, limit)) {
      if (!row.title || !row.price || !row.city) continue;

      const dealType = (row.dealType as 'rent' | 'sale') ?? 'sale';
      const propertyType = (row.propertyType as ParsedListing['propertyType']) ?? 'apartment';

      if (options.city && row.city !== options.city) continue;
      if (options.dealType && dealType !== options.dealType) continue;

      listings.push({
        title: row.title,
        description: row.description || `Объявление: ${row.title}`,
        price: parseFloat(row.price || '0'),
        currency: row.currency || 'RUB',
        city: row.city,
        address: row.address || row.city,
        district: row.district,
        rooms: row.rooms ? parseInt(row.rooms) : undefined,
        area: row.area ? parseFloat(row.area) : undefined,
        floor: row.floor ? parseInt(row.floor) : undefined,
        totalFloors: row.totalFloors ? parseInt(row.totalFloors) : undefined,
        propertyType,
        dealType,
        images: row.images ? row.images.split('|').filter(Boolean) : [],
        sourceName: this.sourceName,
        sourceUrl: row.sourceUrl || `https://kvartal.ru/csv/${Date.now()}-${Math.random()}`,
        publishedAt: row.publishedAt ? new Date(row.publishedAt) : new Date(),
      });
    }

    return listings;
  }
}
