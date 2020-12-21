import { createBot } from './bot';

createBot({
  discordSettings: {
    token: process.env.TOKEN || '',
    channelId: process.env.CHANNEL_ID || '',
  },
  databaseSettings: {
    configurationTableName: 'Configuration',
    userTableName: 'Users',
    challengeTableName: 'Challenges',
    battleTableName: 'Battles',
    showdownIdIndexName: 'showdownId-index',
    tripcodeIndexName: 'tripcode-index',
  },
  showdownSettings: {
    username: process.env.SHOWDOWN_USERNAME || '',
    password: process.env.SHOWDOWN_PASSWORD || '',
  },
  awsSettings: {
    roleStepFunctionArn: process.env.ROLE_STEP_FUNCTION_ARN || '',
  },
});
