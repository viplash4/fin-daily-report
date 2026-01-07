try {
  require('dotenv').config();
} catch (e) {
  // dotenv не обов'язковий
}

import { getTodayStatement } from './mono';
import { generateReport, getTransactionStats } from './report';
import { sendMessage } from './telegram';

interface Config {
  monoToken: string;
  monoAccountId: string;
  tgBotToken: string;
  tgChatId: string;
  dryRun: boolean;
}

function getConfig(): Config {
  const monoToken = process.env.MONO_TOKEN;
  const monoAccountId = process.env.MONO_ACCOUNT_ID;
  const tgBotToken = process.env.TG_BOT_TOKEN;
  const tgChatId = process.env.TG_CHAT_ID;
  const dryRun = process.env.DRY_RUN === 'true';
  
  if (!monoToken) {
    throw new Error('MONO_TOKEN не встановлено');
  }
  if (!monoAccountId) {
    throw new Error('MONO_ACCOUNT_ID не встановлено');
  }
  if (!tgBotToken) {
    throw new Error('TG_BOT_TOKEN не встановлено');
  }
  if (!tgChatId) {
    throw new Error('TG_CHAT_ID не встановлено');
  }
  
  return {
    monoToken,
    monoAccountId,
    tgBotToken,
    tgChatId,
    dryRun,
  };
}

async function main() {
  try {
    const config = getConfig();
    
    if (config.dryRun) {
      console.log('🔍 DRY_RUN режим: повідомлення не будуть надсилатися в Telegram');
    }
    
    console.log('📥 Отримую транзакції з Monobank за сьогодні...');
    
    const transactions = await getTodayStatement(config.monoToken, config.monoAccountId);
    
    const stats = getTransactionStats(transactions);
    console.log(
      `✅ Отримано ${stats.total} транзакцій (${stats.expenses} витрат)`
    );
    
    console.log('📊 Формую звіт...');
    const report = generateReport(transactions);
    
    if (config.dryRun) {
      console.log('\n--- ЗВІТ (DRY_RUN) ---');
      console.log(report);
      console.log('--- КІНЕЦЬ ЗВІТУ ---\n');
      console.log('✅ DRY_RUN завершено успішно');
      return;
    }
    
    console.log('📤 Надсилаю звіт в Telegram...');
    await sendMessage(config.tgBotToken, config.tgChatId, report);
    console.log('✅ Звіт успішно надіслано в Telegram');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Помилка:', errorMessage);
    
    if (errorMessage.includes('MONO_TOKEN') || errorMessage.includes('TG_BOT_TOKEN')) {
      console.error('Перевірте правильність токенів у environment variables');
    }
    
    process.exit(1);
  }
}

main();
