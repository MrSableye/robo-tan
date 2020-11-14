import { registeredCommand as dataCommand } from './data';
import { registeredCommand as randomPokemonCommand } from './random-pokemon';
import { registeredCommand as searchcommand } from './search';
import { createHelpCommand } from './help';
import { createVerifyCommand } from './verify';
import { createWhoCommand } from './who';
import { VerificationClient } from '../../verification';
import { UserDatabaseClient } from '../../verification/store';

// eslint-disable-next-line import/prefer-default-export
export const createCommands = (
  verificationClient: VerificationClient,
  userDatabaseClient: UserDatabaseClient,
) => {
  const verifyCommand = createVerifyCommand(verificationClient);
  const whoCommand = createWhoCommand(userDatabaseClient);
  const helpCommand = createHelpCommand([
    dataCommand,
    randomPokemonCommand,
    searchcommand,
    verifyCommand,
    whoCommand,
  ]);

  return [
    helpCommand,
    dataCommand,
    randomPokemonCommand,
    searchcommand,
    whoCommand,
    verifyCommand,
  ];
};
