import { PrismaClient, PropertyType, DealType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург'];
const DISTRICTS_MOSCOW = ['Центральный', 'Преображенский', 'Сокольники', 'Измайлово', 'Хамовники', 'Арбат', 'Щукино'];
const DISTRICTS_SPB = ['Василеостровский', 'Петроградский', 'Центральный', 'Адмиралтейский', 'Московский'];
const STREET_NAMES = ['ул. Ленина', 'ул. Мира', 'пр-т Победы', 'ул. Садовая', 'ул. Тверская', 'пр-т Невский', 'ул. Пушкина', 'ул. Гагарина'];

const LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800',
  'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=800',
  'https://images.unsplash.com/photo-1581416297614-7f5e49da31e6?w=800',
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomImages(count = 3): string[] {
  const shuffled = [...LISTING_IMAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getDistricts(city: string): string[] {
  if (city === 'Москва') return DISTRICTS_MOSCOW;
  if (city === 'Санкт-Петербург') return DISTRICTS_SPB;
  return ['Центральный', 'Северный', 'Южный', 'Западный', 'Восточный'];
}

function generateTitle(rooms: number | null, dealType: DealType, propertyType: PropertyType, city: string): string {
  const deal = dealType === 'rent' ? 'аренда' : 'продажа';
  if (propertyType === 'studio') return `Квартира-студия, ${deal}, ${city}`;
  if (propertyType === 'newbuilding') return `Квартира в новостройке, ${rooms || 2}-комн., ${city}`;
  if (rooms === null) return `Квартира, ${deal}, ${city}`;
  return `${rooms}-комнатная квартира, ${deal}, ${city}`;
}

function generateDescription(rooms: number | null, area: number, floor: number, totalFloors: number, district: string): string {
  const descs = [
    `Просторная квартира в районе ${district}. Хороший ремонт, вся техника остается. Рядом метро, магазины, парк. Тихий двор. ${floor} из ${totalFloors} этажей. Площадь ${area} м².`,
    `Отличная квартира с удобной планировкой в ${district}. Светлые комнаты, большие окна. Развитая инфраструктура, остановки транспорта рядом. Площадь ${area} м², этаж ${floor}/${totalFloors}.`,
    `Уютная квартира в жилом доме в районе ${district}. Свежий ремонт, встроенная кухня. Закрытый двор, парковка. ${rooms || 1} комната(ы), площадь ${area} м².`,
    `Сдается/продается квартира в хорошем состоянии. Район ${district}. Рядом школа, детский сад, торговый центр. Площадь ${area} м², этаж ${floor}/${totalFloors}.`,
  ];
  return randomItem(descs);
}

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  await prisma.favorite.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@kvartal.ru',
      name: 'Администратор',
      password: adminPass,
      role: 'admin',
      phone: '+7 (900) 000-00-00',
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: { email: 'ivan@example.com', name: 'Иван Петров', password: userPass, phone: '+7 (912) 345-67-89' },
    }),
    prisma.user.create({
      data: { email: 'maria@example.com', name: 'Мария Сидорова', password: userPass, phone: '+7 (923) 456-78-90' },
    }),
    prisma.user.create({
      data: { email: 'alexey@example.com', name: 'Алексей Козлов', password: userPass, phone: '+7 (934) 567-89-01' },
    }),
  ]);

  const allUsers = [admin, ...users];
  const listings: any[] = [];

  const propertyTypes: PropertyType[] = ['apartment', 'apartment', 'apartment', 'studio', 'newbuilding', 'room'];
  const dealTypes: DealType[] = ['sale', 'sale', 'rent', 'rent', 'sale'];

  for (let i = 0; i < 60; i++) {
    const city = randomItem(CITIES);
    const districts = getDistricts(city);
    const district = randomItem(districts);
    const street = randomItem(STREET_NAMES);
    const houseNum = randomInt(1, 150);
    const dealType = randomItem(dealTypes);
    const propertyType = randomItem(propertyTypes);
    const rooms = propertyType === 'studio' ? null : randomInt(1, 5);
    const area = randomFloat(20, 120);
    const floor = randomInt(1, 25);
    const totalFloors = floor + randomInt(0, 5);
    const basePrice = dealType === 'rent' ? randomInt(25000, 120000) : randomInt(3500000, 25000000);
    const author = randomItem(allUsers);
    const daysAgo = randomInt(0, 90);
    const publishedAt = new Date(Date.now() - daysAgo * 86400000);

    listings.push({
      title: generateTitle(rooms, dealType, propertyType, city),
      description: generateDescription(rooms, area, floor, totalFloors, district),
      price: basePrice,
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
      images: randomImages(randomInt(2, 5)),
      sourceName: 'seed',
      sourceUrl: `https://kvartal.ru/seed/listing-${i + 1}`,
      publishedAt,
      authorId: author.id,
    });
  }

  for (const listing of listings) {
    await prisma.listing.create({ data: listing });
  }

  console.log(`✅ Создано ${listings.length} объявлений`);
  console.log('✅ Создано 4 пользователя (1 admin + 3 user)');
  console.log('');
  console.log('Учётные данные для входа:');
  console.log('  Admin: admin@kvartal.ru / admin123');
  console.log('  User:  ivan@example.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
