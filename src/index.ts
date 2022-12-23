import { createBot } from './bot.js';
import { logExecution } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

logExecution(
  'INITIALIZATION',
  'Initializing bot',
  'Initialized bot',
  async () => await createBot({
    discord: {
      token: process.env.TOKEN || '',
      channelId: process.env.CHANNEL_ID || '',
    },
    database: {
      configurationTable: 'Configuration',
      battleTable: 'Battles',
    },
    showdown: {
      username: process.env.SHOWDOWN_USERNAME || '',
      password: process.env.SHOWDOWN_PASSWORD || '',
      avatar: process.env.SHOWDOWN_AVATAR,
    },
  }),
);
