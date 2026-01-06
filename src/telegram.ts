/**
 * Клієнт для роботи з Telegram Bot API
 */

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

const MAX_MESSAGE_LENGTH = 4096;

export async function sendMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  const url = `${TELEGRAM_API_BASE}${botToken}/sendMessage`;
  
  if (text.length > MAX_MESSAGE_LENGTH) {
    await sendLongMessage(url, chatId, text);
    return;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Telegram API: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }
}

async function sendLongMessage(
  url: string,
  chatId: string,
  text: string
): Promise<void> {
  const lines = text.split('\n');
  let currentMessage = '';
  
  for (const line of lines) {
    if (currentMessage.length + line.length + 1 > MAX_MESSAGE_LENGTH) {
      if (currentMessage.trim()) {
        await sendSingleMessage(url, chatId, currentMessage.trim());
        currentMessage = '';
      }
      
      if (line.length > MAX_MESSAGE_LENGTH) {
        const chunks = chunkString(line, MAX_MESSAGE_LENGTH);
        for (const chunk of chunks) {
          await sendSingleMessage(url, chatId, chunk);
        }
        continue;
      }
    }
    
    currentMessage += (currentMessage ? '\n' : '') + line;
  }
  
  if (currentMessage.trim()) {
    await sendSingleMessage(url, chatId, currentMessage.trim());
  }
}

async function sendSingleMessage(
  url: string,
  chatId: string,
  text: string
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Telegram API: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }
}

function chunkString(str: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

