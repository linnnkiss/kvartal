import 'dotenv/config';
import { runParser } from './parser.service';
import { prisma } from '../../lib/prisma';

async function main() {
  const source = (process.argv[2] as 'csv' | 'avito' | 'yandex') ?? 'yandex';
  const limit = parseInt(process.argv[3] ?? '30');
  const city = process.argv[4];

  console.log(`🔍 Запуск парсера: source=${source}, limit=${limit}${city ? ', city=' + city : ''}`);

  const result = await runParser({ source, limit, city });

  console.log('');
  console.log('✅ Результат:');
  console.log(`   Обработано: ${result.total}`);
  console.log(`   Сохранено:  ${result.saved}`);
  console.log(`   Пропущено:  ${result.skipped} (дубликаты или ошибки)`);
  console.log('');
  console.log('Для просмотра данных: npm run db:studio --workspace=apps/api');
}

main()
  .catch((err) => {
    console.error('Ошибка парсера:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
