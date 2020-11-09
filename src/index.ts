import Discord from 'discord.js';
import { handleMessage } from './discord';

const token = process.env.TOKEN || '';

const discordClient = new Discord.Client();

discordClient.on('ready', () => {
  console.log(`Successfully logged in as ${discordClient.user?.tag}`);
});
discordClient.on('message', handleMessage);
discordClient.login(token);
