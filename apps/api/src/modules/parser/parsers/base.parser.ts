export interface ParsedListing {
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  address: string;
  district?: string;
  rooms?: number;
  area?: number;
  floor?: number;
  totalFloors?: number;
  propertyType: 'apartment' | 'studio' | 'newbuilding' | 'room' | 'house';
  dealType: 'rent' | 'sale';
  images: string[];
  sourceName: string;
  sourceUrl: string;
  publishedAt: Date;
}

export interface ParserOptions {
  limit?: number;
  city?: string;
  dealType?: 'rent' | 'sale';
}

export abstract class ListingParser {
  abstract readonly sourceName: string;

  protected abstract fetchListings(options: ParserOptions): Promise<ParsedListing[]>;

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected randomDelay(minMs = 1000, maxMs = 3000): Promise<void> {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return this.delay(ms);
  }

  async run(options: ParserOptions = {}): Promise<ParsedListing[]> {
    console.log(`[${this.sourceName}] Запуск парсера...`);
    try {
      const listings = await this.fetchListings(options);
      console.log(`[${this.sourceName}] Получено ${listings.length} объявлений`);
      return listings;
    } catch (err) {
      console.error(`[${this.sourceName}] Ошибка: ${(err as Error).message}`);
      return [];
    }
  }
}
