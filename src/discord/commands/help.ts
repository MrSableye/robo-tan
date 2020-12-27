import { Message, MessageEmbed } from 'discord.js';
import { RegisteredCommand } from '../types';

export const createHelpCommand = (registeredCommands: RegisteredCommand[]): RegisteredCommand => {
  const commandHandler = async (message: Message) => {
    const helpEmbed = new MessageEmbed()
      .setTitle('Command help')
      .addFields(registeredCommands.flatMap((registeredCommand) => registeredCommand.help));

    return message.reply(helpEmbed);
  };

  return {
    commands: ['help'],
    handler: commandHandler,
    help: [
      {
        name: '!help',
        value: 'Displays this help text',
        inline: false,
      },
    ],
  };
};
