import { Message, MessageEmbed } from 'discord.js';
import { VerificationClient } from '../../verification';
import { Challenge } from '../../store/challenge';

const createVerificationEmbed = (challenge: Challenge<string[]>) => new MessageEmbed()
  .setDescription('In order to associate your Pokémon Showdown account with your Discord account, you will have to join the following rooms and then use the !verifyps-room-check command. You cannot be in other rooms')
  .addField('Message', `\`\`\`#verify ${challenge.secret.map((room) => `/join ${room}`).join('\n')}\`\`\``);

export const createVerifyPsRoomCommand = (
  showdownRoomVerificationClient: VerificationClient<string[]>,
) => {
  const commandHandler = async (message: Message) => {
    const challenge = await showdownRoomVerificationClient.createChallenge(
      message.author.id,
    );

    return message.author.send(createVerificationEmbed(challenge));
  };

  return {
    commands: ['verifyps-room'],
    handler: commandHandler,
    help: [
      {
        name: '!verifyps-room',
        value: 'Starts the verification process for associating a Discord user with their Pokémon Showdown user. This method will ask you to join a specific set of rooms and is only recommended if you or Robo-tan is locked. Otherwise, use !verifyps',
        inline: false,
      },
    ],
  };
};
