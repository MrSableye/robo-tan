import { createBot } from './bot';

createBot({
  discordSettings: {
    token: process.env.TOKEN || '',
    channelId: process.env.CHANNEL_ID || '',
  },
  databaseSettings: {
    userTableName: 'Users',
    challengeTableName: 'Challenges',
    showdownIdIndexName: 'showdownId-index',
    tripcodeIndexName: 'tripcode-index',
  },
  showdownSettings: {
    username: process.env.SHOWDOWN_USERNAME || '',
    password: process.env.SHOWDOWN_PASSWORD || '',
  },
});
