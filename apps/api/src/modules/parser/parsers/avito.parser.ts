import { spawn } from 'child_process';
import * as path from 'path';
import { ListingParser, ParsedListing, ParserOptions } from './base.parser';

const CITY_NAMES: Record<string, string> = {
  moskva: 'Москва',
  'sankt-peterburg': 'Санкт-Петербург',
  nizhniy_novgorod: 'Нижний Новгород',
  kazan: 'Казань',
  novosibirsk: 'Новосибирск',
  ekaterinburg: 'Екатеринбург',
  samara: 'Самара',
  omsk: 'Омск',
  chelyabinsk: 'Челябинск',
  rostov_na_donu: 'Ростов-на-Дону',
  ufa: 'Уфа',
  krasnoyarsk: 'Красноярск',
  perm: 'Пермь',
  voronezh: 'Воронеж',
  volgograd: 'Волгоград',
};

function parseTitleDetails(title: string): {
  rooms?: number;
  area?: number;
  floor?: number;
  totalFloors?: number;
  propertyType: ParsedListing['propertyType'];
} {
  const lower = title.toLowerCase();

  let propertyType: ParsedListing['propertyType'] = 'apartment';
  if (lower.includes('студия')) propertyType = 'studio';
  else if (lower.includes('комната')) propertyType = 'room';
  else if (lower.includes('дом') || lower.includes('коттедж') || lower.includes('дача')) propertyType = 'house';
  else if (lower.includes('новостройка') || lower.includes('жк ')) propertyType = 'newbuilding';

  const roomsMatch = title.match(/(\d+)-комн/);
  const rooms = roomsMatch ? parseInt(roomsMatch[1]) : undefined;

  const areaMatch = title.match(/[\d,.]+\s*м²/);
  const area = areaMatch ? parseFloat(areaMatch[0].replace(',', '.')) : undefined;

  const floorMatch = title.match(/(\d+)\/(\d+)\s*эт/);
  const floor = floorMatch ? parseInt(floorMatch[1]) : undefined;
  const totalFloors = floorMatch ? parseInt(floorMatch[2]) : undefined;

  return { rooms, area, floor, totalFloors, propertyType };
}

// Путь к bridge-скрипту относительно корня монорепы
const BRIDGE_PATH = path.resolve(
  __dirname,
  '../../../../../../parser_avito-3.2.13/kvartal_bridge.py',
);

interface BridgeItem {
  id: number;
  title: string;
  description: string;
  price: number;
  priceString: string;
  url: string;
  address: string;
  images: string[];
  publishedAt: number | null;
  category: string;
}

function runBridge(url: string, limit: number): Promise<BridgeItem[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [BRIDGE_PATH, '--url', url, '--limit', String(limit)]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (stderr.trim()) {
        console.warn('[avito-bridge] stderr:', stderr.trim());
        try {
          const errorPayload = JSON.parse(stderr.trim());
          if (errorPayload?.error) {
            reject(new Error(errorPayload.error));
            return;
          }
        } catch {
          // stderr may contain non-JSON diagnostics from Python dependencies.
        }
      }

      if (code && code !== 0) {
        reject(new Error(`bridge exited with code ${code}`));
        return;
      }

      try {
        const data = JSON.parse(stdout.trim() || '[]');
        resolve(Array.isArray(data) ? data : []);
      } catch {
        console.error('[avito-bridge] JSON parse error. stdout:', stdout.slice(0, 300));
        resolve([]);
      }
    });

    proc.on('error', reject);

    // таймаут 60 сек на один вызов bridge
    setTimeout(() => {
      proc.kill();
      reject(new Error('bridge timeout'));
    }, 60_000);
  });
}

export class AvitoParser extends ListingParser {
  readonly sourceName = 'avito';
  lastError: string | null = null;

  protected async fetchListings(options: ParserOptions): Promise<ParsedListing[]> {
    this.lastError = null;
    const citySlug = options.city || 'nizhniy_novgorod';
    const cityName = CITY_NAMES[citySlug] || citySlug;
    const dealType = options.dealType || 'sale';

    // Берём max 2 объявления за один запрос — по совету README
    const limit = Math.min(options.limit ?? 2, 2);

    const section = dealType === 'rent' ? 'sdam' : 'prodam';
    const url = `https://www.avito.ru/${citySlug}/kvartiry/${section}`;

    console.log(`[avito] Запрос: ${url} (limit=${limit})`);

    // Задержка перед запросом: 5-10 сек (рекомендация README)
    await this.randomDelay(5_000, 10_000);

    let raw: BridgeItem[] = [];
    try {
      raw = await runBridge(url, limit);
    } catch (err) {
      const message = (err as Error).message;
      this.lastError = message === 'rate limited (429)'
        ? 'Авито временно ограничил запросы (HTTP 429). Подождите несколько минут, смените город/тип сделки или попробуйте позже.'
        : message;
      console.error('[avito] bridge error:', message);
      return [];
    }

    if (raw.length === 0) {
      this.lastError = 'Bridge не нашёл объявления в ответе Авито. Возможна капча, блокировка или изменение HTML-структуры страницы.';
      console.warn('[avito] Bridge вернул 0 объявлений');
      return [];
    }

    const listings: ParsedListing[] = [];

    for (const item of raw) {
      if (!item.id || !item.title) continue;

      const { rooms, area, floor, totalFloors, propertyType } = parseTitleDetails(item.title);

      listings.push({
        title: item.title,
        description: item.description || item.title,
        price: item.price || 0,
        currency: 'RUB',
        city: cityName,
        address: item.address || cityName,
        rooms,
        area,
        floor,
        totalFloors,
        propertyType,
        dealType,
        images: item.images || [],
        sourceName: this.sourceName,
        sourceUrl: item.url,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
      });
    }

    console.log(`[avito] Обработано ${listings.length} объявлений`);
    return listings;
  }
}
