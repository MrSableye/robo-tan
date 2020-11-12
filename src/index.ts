import { Client } from 'discord.js';
import { createBattleNotifier, handleMessage } from './discord';

const token = process.env.TOKEN || '';
const channelId = process.env.CHANNEL_ID || '';

const client = new Client();
let battleNotifierTimeout: NodeJS.Timeout;

client.on('ready', () => {
  console.log(`Successfully logged in as ${client.user?.tag}`);
  battleNotifierTimeout = createBattleNotifier(client, channelId);
});
client.on('message', handleMessage);
client.on('disconnect', () => {
  clearInterval(battleNotifierTimeout);
});
client.on('error', console.error);

client.login(token);
