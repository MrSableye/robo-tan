import { Message } from 'discord.js';
import { registeredCommands } from './commands';
import { createBattleNotifier } from './notifier';

const commandPrefix = '!'; // TODO: Allow customization of this

// eslint-disable-next-line import/prefer-default-export
export const handleMessage = async (message: Message) => {
  try {
    const [messagePrefix] = message.content.trim().split(/\s+/);
    const matchedCommand = registeredCommands.find(
      (registeredCommand) => registeredCommand.commands.some((command) => messagePrefix === `${commandPrefix}${command}`),
    );

    if (matchedCommand) {
      await matchedCommand.handler(
        message,
        message.content.trim().substr(messagePrefix.length).trim(),
      );
    }
  } catch (error) {
    console.log('Error handling Discord message', error);
  }
};

export { createBattleNotifier };
