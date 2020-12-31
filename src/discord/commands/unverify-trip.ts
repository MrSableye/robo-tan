import { Message } from 'discord.js';
import { createErrorEmbed, createUserEmbed } from '../utility';
import { UserStore } from '../../store/user';

export const createUnverifyTripCommand = (userStore: UserStore) => {
  const commandHandler = async (message: Message) => {
    const user = await userStore.deleteTripcode(message.author.id);

    if (user) {
      const userEmbed = createUserEmbed(message.author, user);
      userEmbed.setFooter('Removed 4chan tripcode successfully');
      return message.reply(userEmbed);
    }

    return message.reply(createErrorEmbed('User does not have a profile'));
  };

  return {
    commands: ['unverifytrip'],
    handler: commandHandler,
    help: [
      {
        name: '!unverifytrip',
        value: 'Removes your 4chan tripcode',
        inline: false,
      },
    ],
  };
};
