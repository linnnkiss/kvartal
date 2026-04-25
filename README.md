# 🏠 Квартал — Pet-проект: аналог маркетплейса недвижимости

Учебный full-stack проект. Платформа для поиска и публикации объявлений о продаже и аренде квартир.

> ⚠️ Проект учебный, не коммерческий. Собственный бренд и дизайн.

---

## Стек технологий

| Слой        | Технологии                                               |
|-------------|----------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, React Router  |
| Backend     | Node.js, Express, TypeScript                            |
| База данных | PostgreSQL 15                                           |
| ORM         | Prisma                                                  |
| Auth        | JWT (jsonwebtoken + bcryptjs)                           |
| Парсер      | Node.js (абстрактный класс + Demo/CSV адаптеры)         |
| DevOps      | Docker Compose                                          |

---

## Структура проекта

```
kvartal/
├── apps/
│   ├── api/                    # Backend (Express + Prisma)
│   │   ├── src/
│   │   │   ├── modules/        # auth, users, listings, favorites, parser
│   │   │   ├── middleware/     # auth, error, rateLimiter
│   │   │   ├── lib/            # prisma, logger
│   │   │   ├── config/         # env config
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── package.json
│   └── web/                    # Frontend (React + Vite)
│       ├── src/
│       │   ├── pages/          # HomePage, ListingsPage, ...
│       │   ├── components/     # layout, listings, ui
│       │   ├── contexts/       # AuthContext
│       │   ├── lib/            # api clients, formatting
│       │   └── App.tsx
│       └── package.json
├── packages/
│   └── shared/                 # Общие TypeScript типы
├── docker-compose.yml
└── README.md
```

---

## Быстрый старт

### 1. Требования

- Node.js 20+
- Docker Desktop (для PostgreSQL)

### 2. Клонирование и установка

```bash
cd kvartal
npm install
```

### 3. Запуск PostgreSQL

```bash
npm run db:up
```

### 4. Настройка переменных окружения

```bash
cp .env.example apps/api/.env
# Значения по умолчанию уже заполнены под Docker Compose
```

### 5. Миграции и seed

```bash
# Генерация Prisma клиента
cd apps/api && npx prisma generate && cd ../..

# Применение миграций
npm run db:migrate

# Заполнение тестовыми данными (60 объявлений + 4 аккаунта)
npm run db:seed
```

### 6. Запуск всего проекта

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api/health

---

## Тестовые аккаунты

| Роль  | Email                  | Пароль   |
|-------|------------------------|----------|
| Admin | admin@kvartal.ru       | admin123 |
| User  | ivan@example.com       | user123  |
| User  | maria@example.com      | user123  |

---

## API Endpoints

| Метод  | Endpoint                         | Описание                    | Auth    |
|--------|----------------------------------|-----------------------------|---------|
| GET    | /api/listings                    | Список объявлений + фильтры | —       |
| GET    | /api/listings/:id                | Объявление по ID            | —       |
| POST   | /api/listings                    | Создать объявление          | ✅      |
| PATCH  | /api/listings/:id                | Обновить объявление         | ✅      |
| DELETE | /api/listings/:id                | Удалить объявление          | ✅      |
| GET    | /api/listings/admin/all          | Все объявления (admin)      | Admin   |
| GET    | /api/listings/admin/stats        | Статистика (admin)          | Admin   |
| POST   | /api/auth/register               | Регистрация                 | —       |
| POST   | /api/auth/login                  | Вход                        | —       |
| GET    | /api/me                          | Мой профиль                 | ✅      |
| PATCH  | /api/me                          | Обновить профиль            | ✅      |
| GET    | /api/me/listings                 | Мои объявления              | ✅      |
| GET    | /api/favorites                   | Избранное                   | ✅      |
| GET    | /api/favorites/ids               | ID избранных                | ✅      |
| POST   | /api/favorites/:listingId        | Добавить в избранное        | ✅      |
| DELETE | /api/favorites/:listingId        | Убрать из избранного        | ✅      |
| POST   | /api/parser/run                  | Запустить парсер            | Admin   |

### Параметры GET /api/listings

| Параметр     | Тип    | Описание                                        |
|-------------|--------|-------------------------------------------------|
| city        | string | Фильтр по городу                               |
| district    | string | Фильтр по району                               |
| dealType    | rent/sale | Тип сделки                                 |
| propertyType| apartment/studio/newbuilding/room/house | Тип жилья |
| rooms       | number | Кол-во комнат                                  |
| priceMin    | number | Цена от                                        |
| priceMax    | number | Цена до                                        |
| areaMin     | number | Площадь от                                     |
| areaMax     | number | Площадь до                                     |
| sortBy      | price_asc/price_desc/date_asc/date_desc | Сортировка |
| page        | number | Страница (default: 1)                          |
| limit       | number | Кол-во на странице (default: 20, max: 50)      |
| search      | string | Полнотекстовый поиск                           |

---

## Парсер

### Запуск из командной строки

```bash
# Demo-генератор (создаёт тестовые объявления)
npm run parse:realestate

# С параметрами: source limit city
cd apps/api && npx tsx src/modules/parser/run.ts demo 30 Москва

# CSV импорт
cd apps/api && npx tsx src/modules/parser/run.ts csv
```

### Добавление нового парсера

```typescript
// apps/api/src/modules/parser/parsers/my.parser.ts
import { ListingParser, ParsedListing, ParserOptions } from './base.parser';

export class MyParser extends ListingParser {
  readonly sourceName = 'my-source';

  protected async fetchListings(options: ParserOptions): Promise<ParsedListing[]> {
    // Ваша логика парсинга
    // ВАЖНО: соблюдать robots.txt, добавлять задержки (this.randomDelay())
    return [];
  }
}
```

### CSV формат

Создайте `apps/api/src/data/listings.csv` (пример в `listings-sample.csv`):

```csv
title,description,price,currency,city,address,district,rooms,area,floor,totalFloors,propertyType,dealType,images,sourceUrl,publishedAt
"1-комн. квартира","Описание...",50000,RUB,Москва,"Москва, ул. Ленина, д.1",Центральный,1,38,3,9,apartment,rent,"url1|url2",https://source.ru/1,2024-01-01
```

---

## Docker Compose (полный запуск)

```bash
# Собрать и запустить всё
docker-compose up --build

# Только БД (для локальной разработки)
docker-compose up -d db
```

---

## Расширение проекта

### Добавить новый тип объявлений (например, гаражи)

1. Добавить `garage` в enum `PropertyType` в `prisma/schema.prisma`
2. Обновить `PROPERTY_TYPE_LABELS` в `apps/web/src/lib/format.ts`
3. Добавить опцию в `FiltersSidebar.tsx`
4. Создать миграцию: `npm run db:migrate`

### Добавить карту (OpenStreetMap/Yandex Maps)

1. Установить leaflet: `npm install leaflet react-leaflet --workspace=apps/web`
2. Заменить заглушку в `ListingDetailsPage.tsx` компонентом `<MapContainer>`

### Добавить загрузку фотографий

1. Настроить S3/Cloudinary для хранения
2. Добавить endpoint `POST /api/upload` с multer
3. Обновить форму создания объявления

### Добавить уведомления

1. Добавить таблицу `Notification` в Prisma schema
2. Реализовать WebSocket через `socket.io`
3. Отправлять уведомления при новых объявлениях в избранных поисках

---

## Команды разработки

```bash
npm run dev              # Запустить frontend + backend
npm run db:up            # Поднять PostgreSQL
npm run db:migrate       # Применить миграции
npm run db:seed          # Заполнить тестовыми данными
npm run db:studio        # Открыть Prisma Studio
npm run parse:realestate # Запустить парсер
```
