import 'dotenv/config';
import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const app = createApp();

app.listen(config.port, async () => {
  logger.info(`🏠 Квартал API запущен → http://localhost:${config.port}`);
  logger.info(`📊 Режим: ${config.nodeEnv}`);

  try {
    await prisma.$connect();
    logger.info('✅ Подключение к PostgreSQL установлено');
  } catch (err) {
    logger.error('❌ Ошибка подключения к БД: ' + (err as Error).message);
  }
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing...');
  await prisma.$disconnect();
  process.exit(0);
});
