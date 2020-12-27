import { User as DiscordUser, Message, MessageEmbed } from 'discord.js';
import { UserDatabaseClient } from '../../verification';

const createUserSearchEmbed = (tripcode: string, discordUsers: DiscordUser[]) => {
  const userSearchEmbed = new MessageEmbed()
    .setAuthor(
      `Tripcode results for: ${tripcode}`,
      'https://i.imgur.com/3Ak7F4e.png',
      `https://archive.nyafuu.org/vp/search/tripcode/${tripcode}/`,
    );

  if (discordUsers.length > 0) {
    const description = discordUsers.map(
      (discordUser) => `• [${discordUser.username}#${discordUser.discriminator}](https://discordapp.com/users/${discordUser.id})`,
    ).join('\n');

    userSearchEmbed.setDescription(description);
  } else {
    userSearchEmbed.setDescription('No users found');
  }

  return userSearchEmbed;
};

export const createTripCommand = (userDatabaseClient: UserDatabaseClient) => {
  const commandHandler = async (message: Message, commandText: string) => {
    const tripcode = commandText;
    const users = await userDatabaseClient.getUsersByTripcode(tripcode);
    const discordUsers = await Promise.all(
      users.map((user) => message.client.users.fetch(user.discordId)),
    );

    return message.reply(createUserSearchEmbed(tripcode, discordUsers));
  };

  return {
    commands: ['trip', 'tripcode'],
    handler: commandHandler,
    help: [
      {
        name: '!trip <tripcode>',
        value: 'Shows all users associated with the given tripcode',
        inline: false,
      },
    ],
  };
};
