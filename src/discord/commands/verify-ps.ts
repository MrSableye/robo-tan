import { Message, MessageEmbed } from 'discord.js';
import { VerificationClient } from '../../verification';
import { Challenge } from '../../store/challenge';

const createVerificationEmbed = (challenge: Challenge) => new MessageEmbed()
  .setDescription('In order to associate your Pokémon Showdown account with your Discord account, you will have to send a secret message to `Robo-tan` on Pokémon Showdown.')
  .addField('Message', `\`#verify ${challenge.secret}\``);

export const createVerifyPsCommand = (showdownVerificationClient: VerificationClient) => {
  const commandHandler = async (message: Message) => {
    const challenge = await showdownVerificationClient.createChallenge(
      message.author.id,
    );

    return message.author.send(createVerificationEmbed(challenge));
  };

  return {
    commands: ['verifyps'],
    handler: commandHandler,
    help: [
      {
        name: '!verifyps',
        value: 'Starts the verification process for associating a Discord user with their Pokémon Showdown user',
        inline: false,
      },
    ],
  };
};
