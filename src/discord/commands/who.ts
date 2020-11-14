import { User as DiscordUser, Message, MessageEmbed } from 'discord.js';
import { User, UserDatabaseClient } from '../../verification/store';

const createUserEmbed = (discordUser: DiscordUser, user: User) => {
  const author = `${discordUser.username}#${discordUser.discriminator}`;
  const avatar = discordUser.avatarURL() || discordUser.defaultAvatarURL;

  const userEmbed = new MessageEmbed()
    .setAuthor(author, avatar);

  if ('showdownId' in user) {
    userEmbed.addField(
      'Showdown',
      `[${user.showdownDisplayName}](https://pokemonshowdown.com/users/${user.showdownId})`,
    );
  }

  if ('tripcode' in user) {
    userEmbed.addField(
      '4chan',
      user.tripcode,
    );
  }

  return userEmbed;
};

const createErrorEmbed = () => new MessageEmbed()
  .setColor('RED')
  .setDescription('User either does not have a profile or an unknown error occured');

// eslint-disable-next-line import/prefer-default-export
export const createWhoCommand = (userDatabaseClient: UserDatabaseClient) => {
  const commandHandler = async (message: Message) => {
    const user = await userDatabaseClient.getUser(message.author.id);

    if (user) {
      await message.reply(createUserEmbed(message.author, user));
    } else {
      await message.reply(createErrorEmbed());
    }
  };

  return {
    commands: ['who'],
    handler: commandHandler,
    help: [
      {
        name: '!who',
        value: 'Starts the verification process for associating a Discord user with their Pokémon Showdown user',
        inline: false,
      },
    ],
  };
};
