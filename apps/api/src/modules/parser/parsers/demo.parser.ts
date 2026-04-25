import { ListingParser, ParsedListing, ParserOptions } from './base.parser';

const DEMO_CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск'];
const DEMO_DISTRICTS: Record<string, string[]> = {
  'Москва': ['Арбат', 'Хамовники', 'Преображенский', 'Сокольники', 'Щукино', 'Измайлово'],
  'Санкт-Петербург': ['Василеостровский', 'Петроградский', 'Центральный', 'Московский'],
  'Казань': ['Вахитовский', 'Ново-Савиновский', 'Авиастроительный'],
  'Новосибирск': ['Центральный', 'Железнодорожный', 'Октябрьский'],
};
const STREETS = ['ул. Ленина', 'ул. Пушкина', 'пр-т Мира', 'ул. Садовая', 'ул. Советская', 'ул. Новая'];
const IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800',
];

function rand<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

export class DemoParser extends ListingParser {
  readonly sourceName = 'demo-generator';

  protected async fetchListings(options: ParserOptions): Promise<ParsedListing[]> {
    const limit = options.limit ?? 20;
    const listings: ParsedListing[] = [];

    for (let i = 0; i < limit; i++) {
      await this.randomDelay(50, 150);

      const city = options.city ?? rand(DEMO_CITIES);
      const districts = DEMO_DISTRICTS[city] ?? ['Центральный'];
      const district = rand(districts);
      const street = rand(STREETS);
      const houseNum = randInt(1, 200);
      const dealType = options.dealType ?? (Math.random() > 0.5 ? 'sale' : 'rent');
      const propertyTypes = ['apartment', 'apartment', 'apartment', 'studio', 'newbuilding'] as const;
      const propertyType = rand(propertyTypes);
      const rooms = propertyType === 'studio' ? undefined : randInt(1, 5);
      const area = randFloat(22, 130);
      const floor = randInt(1, 25);
      const totalFloors = floor + randInt(0, 5);
      const price = dealType === 'rent'
        ? randInt(20000, 130000)
        : randInt(3000000, 30000000);

      const daysAgo = randInt(0, 60);
      const uniqueId = Date.now() + i;

      listings.push({
        title: `${rooms ? rooms + '-комн. ' : 'Студия '}квартира, ${dealType === 'rent' ? 'аренда' : 'продажа'}, ${city}`,
        description: `Просторная квартира в районе ${district}. Свежий ремонт, вся техника. Площадь ${area} м², этаж ${floor}/${totalFloors}. Рядом метро и магазины.`,
        price,
        currency: 'RUB',
        city,
        address: `${city}, ${district}, ${street}, д. ${houseNum}`,
        district,
        rooms,
        area,
        floor,
        totalFloors,
        propertyType,
        dealType,
        images: [rand(IMAGES), rand(IMAGES)].filter((v, i, a) => a.indexOf(v) === i),
        sourceName: this.sourceName,
        sourceUrl: `https://kvartal.ru/demo/listing-${uniqueId}-${i}`,
        publishedAt: new Date(Date.now() - daysAgo * 86400000),
      });
    }

    return listings;
  }
}
