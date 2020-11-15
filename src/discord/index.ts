import { Message } from 'discord.js';
import { VerificationClient } from '../verification';
import { UserDatabaseClient } from '../verification/store';
import { createCommands } from './commands';
import {
  createBattlePostHandler,
  createThreadHandler,
  createChallengePostHandler,
} from './notifier';
import { RegisteredCommand } from './types';

const commandPrefix = '!'; // TODO: Allow customization of this

// eslint-disable-next-line import/prefer-default-export
export const createMessageHandler = (
  verificationClient: VerificationClient,
  userDatabaseClient: UserDatabaseClient,
) => {
  const registeredCommands: RegisteredCommand[] = createCommands(
    verificationClient,
    userDatabaseClient,
  );

  return async (message: Message) => {
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
};

export { createBattlePostHandler, createThreadHandler, createChallengePostHandler };
