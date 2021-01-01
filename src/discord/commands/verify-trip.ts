import { Message, MessageEmbed } from 'discord.js';
import { VerificationClient } from '../../verification';
import { Challenge } from '../../store/challenge';

const createVerificationEmbed = (challenge: Challenge) => new MessageEmbed()
  .setDescription('In order to associate your tripcode with your Discord account, you will have to create a post in the current thread with your tripcode and the following name.')
  .addField('Name', `\`VerifyUser${challenge.secret}\``);

export const createVerifyTripCommand = (yotsubaVerificationClient: VerificationClient) => {
  const commandHandler = async (message: Message) => {
    const challenge = await yotsubaVerificationClient.createChallenge(
      message.author.id,
    );

    return message.author.send(createVerificationEmbed(challenge));
  };

  return {
    commands: ['verifytrip'],
    handler: commandHandler,
    help: [
      {
        name: '!verifytrip',
        value: 'Starts the verification process for associating a Discord user with a 4chan tripcode',
        inline: false,
      },
    ],
  };
};
