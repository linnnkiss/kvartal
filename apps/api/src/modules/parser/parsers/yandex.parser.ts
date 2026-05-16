import { ListingParser, ParsedListing, ParserOptions } from './base.parser';

const CITY_NAMES: Record<string, string> = {
  kaliningrad: 'Калининград',
  moskva: 'Москва',
  'sankt-peterburg': 'Санкт-Петербург',
  nizhniy_novgorod: 'Нижний Новгород',
  kazan: 'Казань',
  novosibirsk: 'Новосибирск',
  ekaterinburg: 'Екатеринбург',
  samara: 'Самара',
  omsk: 'Омск',
  chelyabinsk: 'Челябинск',
  'rostov-na-donu': 'Ростов-на-Дону',
  ufa: 'Уфа',
  krasnoyarsk: 'Красноярск',
  perm: 'Пермь',
  voronezh: 'Воронеж',
  volgograd: 'Волгоград',
  krasnodar: 'Краснодар',
};

type YandexOffer = {
  offerId: string;
  url?: string;
  offerType?: 'RENT' | 'SELL';
  offerCategory?: string;
  roomsTotal?: number;
  floorsTotal?: number;
  floorsOffered?: number[];
  area?: { value?: number };
  livingSpace?: { value?: number };
  kitchenSpace?: { value?: number };
  price?: {
    value?: number;
    currency?: string;
    price?: { currency?: string };
  };
  description?: string;
  creationDate?: string;
  updateDate?: string;
  location?: {
    address?: string;
    geocoderAddress?: string;
    streetAddress?: string;
    subjectFederationName?: string;
    structuredAddress?: {
      component?: Array<{
        value?: string;
        regionType?: string;
      }>;
    };
  };
  building?: {
    siteDisplayName?: string;
    locativeFullName?: string;
  };
  apartment?: {
    renovation?: string;
  };
  mainImages?: string[];
  fullImages?: string[];
  appLargeImages?: string[];
  appMiddleImages?: string[];
  appSmallSnippetImages?: string[];
};

function normalizeUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('//') ? `https:${url}` : url;
}

function extractDistrict(offer: YandexOffer): string | undefined {
  const components = offer.location?.structuredAddress?.component ?? [];
  const district = components.find((component) => {
    const regionType = component.regionType ?? '';
    return regionType.includes('DISTRICT') || regionType.includes('MUNICIPALITY');
  });

  return district?.value;
}

function getAreaValue(offer: YandexOffer): number | undefined {
  return offer.area?.value ?? offer.livingSpace?.value;
}

function buildTitle(offer: YandexOffer, cityName: string): string {
  const rooms = offer.roomsTotal;
  const roomsLabel = rooms === 0 ? 'Студия' : rooms ? `${rooms}-комн. квартира` : 'Квартира';
  const area = getAreaValue(offer);
  const floor = offer.floorsOffered?.[0];
  const totalFloors = offer.floorsTotal;
  const pieces = [roomsLabel];

  if (area) pieces.push(`${area} м²`);
  if (floor && totalFloors) pieces.push(`${floor}/${totalFloors} эт.`);

  const buildingLabel = offer.building?.locativeFullName || offer.building?.siteDisplayName;
  if (buildingLabel) pieces.push(buildingLabel.replace(/^в\s+/i, ''));
  else if (!area) pieces.push(cityName);

  return pieces.join(', ');
}

function extractOffers(html: string): YandexOffer[] {
  const needle = '"search":{"offers":{"entities":[';
  const start = html.indexOf(needle);
  if (start < 0) return [];

  const arrStart = html.indexOf('[', start);
  if (arrStart < 0) return [];

  let depth = 0;
  let inString = false;
  let escaped = false;
  let arrEnd = -1;

  for (let i = arrStart; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        arrEnd = i;
        break;
      }
    }
  }

  if (arrEnd < 0) return [];

  const rawArray = html.slice(arrStart, arrEnd + 1);
  const decoded = JSON.parse(
    `"${rawArray.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
  ) as string;

  return JSON.parse(decoded) as YandexOffer[];
}

async function fetchPage(citySlug: string, dealType: 'rent' | 'sale', page: number) {
  const section = dealType === 'rent' ? 'snyat' : 'kupit';
  const url = new URL(`https://realty.yandex.ru/${citySlug}/${section}/kvartira/`);
  if (page > 1) url.searchParams.set('page', String(page));

  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.7,en;q=0.6',
    },
  });

  if (!response.ok) {
    throw new Error(`Яндекс Недвижимость вернул HTTP ${response.status}`);
  }

  return response.text();
}

export class YandexRealtyParser extends ListingParser {
  readonly sourceName = 'yandex';
  lastError: string | null = null;

  protected async fetchListings(options: ParserOptions): Promise<ParsedListing[]> {
    this.lastError = null;

    const citySlug = options.city || 'kaliningrad';
    const cityName = CITY_NAMES[citySlug] || citySlug;
    const dealType = options.dealType || 'sale';
    const limit = Math.max(1, options.limit ?? 20);
    const pageSize = 20;
    const maxPages = Math.max(1, Math.ceil(limit / pageSize));

    const offersById = new Map<string, YandexOffer>();

    for (let page = 1; page <= maxPages; page++) {
      try {
        const html = await fetchPage(citySlug, dealType, page);
        const offers = extractOffers(html);

        for (const offer of offers) {
          if (offer.offerId && !offersById.has(offer.offerId)) {
            offersById.set(offer.offerId, offer);
          }
        }

        if (offers.length < pageSize) break;
      } catch (err) {
        const message = (err as Error).message || 'Ошибка Яндекс Недвижимости';
        this.lastError = message;
        if (page === 1) {
          throw err;
        }
        break;
      }

      if (offersById.size >= limit) break;
      await this.randomDelay(300, 900);
    }

    if (offersById.size === 0 && !this.lastError) {
      this.lastError = 'Яндекс Недвижимость не вернул объявления. Возможно, изменилась структура страницы.';
    }

    return Array.from(offersById.values())
      .slice(0, limit)
      .map((offer) => {
        const area = getAreaValue(offer);
        const rooms = offer.roomsTotal ?? undefined;
        const floor = offer.floorsOffered?.[0];
        const totalFloors = offer.floorsTotal ?? undefined;
        const address = offer.location?.address
          || offer.location?.geocoderAddress
          || offer.location?.streetAddress
          || cityName;
        const district = extractDistrict(offer);
        const images = [
          ...(offer.mainImages ?? []),
          ...(offer.fullImages ?? []),
          ...(offer.appLargeImages ?? []),
          ...(offer.appMiddleImages ?? []),
          ...(offer.appSmallSnippetImages ?? []),
        ]
          .map(normalizeUrl)
          .filter(Boolean)
          .filter((url, index, self) => self.indexOf(url) === index)
          .slice(0, 10);

        return {
          title: buildTitle(offer, cityName),
          description: offer.description || buildTitle(offer, cityName),
          price: offer.price?.value ?? 0,
          currency: 'RUB',
          city: cityName,
          address,
          district,
          rooms,
          area,
          floor,
          totalFloors,
          propertyType: rooms === 0 ? 'studio' : 'apartment',
          dealType,
          images,
          sourceName: this.sourceName,
          sourceUrl: normalizeUrl(offer.url) || `https://realty.yandex.ru/offer/${offer.offerId}`,
          publishedAt: new Date(offer.creationDate || offer.updateDate || Date.now()),
        } satisfies ParsedListing;
      });
  }
}
