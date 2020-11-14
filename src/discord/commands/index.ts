import { registeredCommand as dataCommand } from './data';
import { registeredCommand as randomPokemonCommand } from './random-pokemon';
import { registeredCommand as searchcommand } from './search';
import { createHelpCommand } from './help';
import { createVerifyCommand } from './verify';
import { createWhoCommand } from './who';
import { createPsCommand } from './ps';
import { createTripCommand } from './trip';
import { VerificationClient } from '../../verification';
import { UserDatabaseClient } from '../../verification/store';

// eslint-disable-next-line import/prefer-default-export
export const createCommands = (
  verificationClient: VerificationClient,
  userDatabaseClient: UserDatabaseClient,
) => {
  const verifyCommand = createVerifyCommand(verificationClient);
  const whoCommand = createWhoCommand(userDatabaseClient);
  const psCommand = createPsCommand(userDatabaseClient);
  const tripCommand = createTripCommand(userDatabaseClient);
  const helpCommand = createHelpCommand([
    dataCommand,
    randomPokemonCommand,
    searchcommand,
    verifyCommand,
    psCommand,
    tripCommand,
    whoCommand,
  ]);

  return [
    helpCommand,
    dataCommand,
    randomPokemonCommand,
    searchcommand,
    whoCommand,
    verifyCommand,
    tripCommand,
    whoCommand,
  ];
};
