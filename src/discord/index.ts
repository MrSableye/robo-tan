import { Message } from 'discord.js';
import { ConfigurationStore } from '../configuration';
import { BotSettings } from '../settings';
import { VerificationClient, UserDatabaseClient } from '../verification';
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
  settings: BotSettings,
  configurationStore: ConfigurationStore,
  verificationClient: VerificationClient,
  userDatabaseClient: UserDatabaseClient,
) => {
  const registeredCommands: RegisteredCommand[] = createCommands(
    settings,
    configurationStore,
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
