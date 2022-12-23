import { createBot } from './bot.js';

console.time('Created bot');
createBot({
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
}).then(() => console.timeEnd('Created bot'));
