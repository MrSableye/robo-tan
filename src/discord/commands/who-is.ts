import { Message } from 'discord.js';
import { createErrorEmbed, createUserEmbed } from '../utility';
import { UserStore } from '../../store/user';

const findDiscordUser = async (message: Message, commandText: string) => {
  if (message.mentions.users.size > 0) {
    return message.mentions.users.first();
  }

  if (commandText.match(/^[0-9]*$/)) {
    const discordUser = await message.client.users.fetch(commandText);

    if (discordUser) {
      return discordUser;
    }
  }

  if (message.guild) {
    const guildMembers = await message.guild.members.fetch();

    let searchResult = guildMembers.find((guildMember) => {
      const usernameAndDisciminator = `${guildMember.user.username}#${guildMember.user.discriminator}`;

      return commandText === usernameAndDisciminator;
    });

    if (!searchResult) {
      searchResult = guildMembers.find((guildMember) => {
        const nickname = guildMember.nickname || guildMember.user.username;

        return nickname.includes(commandText);
      });
    }

    if (searchResult) {
      return searchResult.user;
    }
  }

  return undefined;
};

export const createWhoIsCommand = (userStore: UserStore) => {
  const commandHandler = async (message: Message, commandText: string) => {
    const discordUser = await findDiscordUser(message, commandText);

    if (discordUser) {
      const user = await userStore.getUser(discordUser.id);

      if (user) {
        return message.reply(createUserEmbed(discordUser, user));
      }
    }

    return message.reply(createErrorEmbed('User does not have a profile'));
  };

  return {
    commands: ['whois'],
    handler: commandHandler,
    help: [
      {
        name: '!whois <user>',
        value: 'Displays the user profile of the given user',
        inline: false,
      },
    ],
  };
};
