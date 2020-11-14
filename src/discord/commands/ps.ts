import { User as DiscordUser, Message, MessageEmbed } from 'discord.js';
import { UserDatabaseClient } from '../../verification/store';

const toId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');

const createUserSearchEmbed = (username: string, discordUsers: DiscordUser[]) => {
  const userSearchEmbed = new MessageEmbed()
    .setAuthor(
      `Showdown results for: ${username}`,
      'https://i.imgur.com/3Ak7F4e.png',
    );

  if (discordUsers.length > 0) {
    const description = discordUsers.map(
      (discordUser) => `- ${discordUser.username}#${discordUser.discriminator}`,
    ).join('\n');

    userSearchEmbed.setDescription(description);
  } else {
    userSearchEmbed.setDescription('No users found');
  }

  return userSearchEmbed;
};

// eslint-disable-next-line import/prefer-default-export
export const createPsCommand = (userDatabaseClient: UserDatabaseClient) => {
  const commandHandler = async (message: Message, commandText: string) => {
    const username = commandText;
    const users = await userDatabaseClient.getUsersByShowdownId(toId(username));
    const discordUsers = await Promise.all(
      users.map((user) => message.client.users.fetch(user.discordId)),
    );

    return message.reply(createUserSearchEmbed(username, discordUsers));
  };

  return {
    commands: ['ps', 'showdown'],
    handler: commandHandler,
    help: [
      {
        name: '!ps <username>',
        value: 'Shows all users associated with the given Showdown username',
        inline: false,
      },
    ],
  };
};