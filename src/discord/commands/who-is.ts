import { Message } from 'discord.js';
import { createErrorEmbed, createUserEmbed } from '../utility';
import { UserDatabaseClient } from '../../verification/store';

// eslint-disable-next-line import/prefer-default-export
export const createWhoIsCommand = (userDatabaseClient: UserDatabaseClient) => {
  const commandHandler = async (message: Message, commandText: string) => {
    let discordId: string;
    if (message.mentions.users.size > 0) {
      discordId = message.mentions.users.first()?.id || '';
    } else {
      discordId = commandText;
    }

    const user = await userDatabaseClient.getUser(discordId);

    if (user) {
      return message.reply(createUserEmbed(message.author, user));
    }

    return message.reply(createErrorEmbed('User does not have a profile'));
  };

  return {
    commands: ['whois'],
    handler: commandHandler,
    help: [
      {
        name: '!whoami <user>',
        value: 'Displays the user profile of the given user',
        inline: false,
      },
    ],
  };
};
