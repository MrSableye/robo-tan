import { Message } from 'discord.js';
import { createErrorEmbed, createUserEmbed } from '../utility';
import { UserDatabaseClient } from '../../verification/store';

// eslint-disable-next-line import/prefer-default-export
export const createWhoAmICommand = (userDatabaseClient: UserDatabaseClient) => {
  const commandHandler = async (message: Message) => {
    const user = await userDatabaseClient.getUser(message.author.id);

    if (user) {
      return message.reply(createUserEmbed(message.author, user));
    }

    return message.reply(createErrorEmbed('User does not have a profile'));
  };

  return {
    commands: ['whoami'],
    handler: commandHandler,
    help: [
      {
        name: '!whoami',
        value: 'Displays your user profile',
        inline: false,
      },
    ],
  };
};
