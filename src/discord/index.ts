import { Message } from 'discord.js';
import { VerificationClient } from '../verification';
import { UserStore } from '../store/user';
import { ConfigurationStore } from '../store/configuration';
import { BotSettings } from '../settings';
import { RegisteredCommand } from './types';
import {
  createBattlePostHandler,
  createChallengePostHandler,
  createThreadHandler,
} from './notifier';
import { createCommands } from './commands';

const commandPrefix = '!'; // TODO: Allow customization of this

export const createMessageHandler = (
  settings: BotSettings,
  configurationStore: ConfigurationStore,
  showdownVerificationClient: VerificationClient,
  yotsubaVerificationClient: VerificationClient,
  showdownRoomVerificationClient: VerificationClient<string[]>,
  userStore: UserStore,
) => {
  const registeredCommands: RegisteredCommand[] = createCommands(
    settings,
    configurationStore,
    showdownVerificationClient,
    yotsubaVerificationClient,
    showdownRoomVerificationClient,
    userStore,
  );

  return async (message: Message) => {
    try {
      const [messagePrefix] = message.content.trim().split(/\s+/);
      const matchedCommand = registeredCommands.find(
        (registeredCommand) => registeredCommand.commands.some((command) => messagePrefix === `${commandPrefix}${command}`),
      );

      if (matchedCommand && messagePrefix) {
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
