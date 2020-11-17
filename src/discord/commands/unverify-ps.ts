import { Message } from 'discord.js';
import { createErrorEmbed, createUserEmbed } from '../utility';
import { UserDatabaseClient } from '../../verification/store';

// eslint-disable-next-line import/prefer-default-export
export const createUnverifyPsCommand = (userDatabaseClient: UserDatabaseClient) => {
  const commandHandler = async (message: Message) => {
    const user = await userDatabaseClient.deleteShowdownId(message.author.id);

    if (user) {
      const userEmbed = createUserEmbed(message.author, user);
      userEmbed.setFooter('Removed Pokémon Showdown user successfully');
      return message.reply(userEmbed);
    }

    return message.reply(createErrorEmbed('User does not have a profile'));
  };

  return {
    commands: ['unverifyps'],
    handler: commandHandler,
    help: [
      {
        name: '!unverifyps',
        value: 'Removes your Pokémon Showdown user',
        inline: false,
      },
    ],
  };
};
