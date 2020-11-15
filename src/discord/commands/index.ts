import { registeredCommand as dataCommand } from './data';
import { registeredCommand as randomPokemonCommand } from './random-pokemon';
import { registeredCommand as searchcommand } from './search';
import { createHelpCommand } from './help';
import { createVerifyPsCommand } from './verify-ps';
import { createVerifyTripCommand } from './verify-trip';
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
  const verifyPsCommand = createVerifyPsCommand(verificationClient);
  const verifyTripCommand = createVerifyTripCommand(verificationClient);
  const whoCommand = createWhoCommand(userDatabaseClient);
  const psCommand = createPsCommand(userDatabaseClient);
  const tripCommand = createTripCommand(userDatabaseClient);
  const helpCommand = createHelpCommand([
    dataCommand,
    randomPokemonCommand,
    searchcommand,
    verifyPsCommand,
    verifyTripCommand,
    psCommand,
    tripCommand,
    whoCommand,
  ]);

  return [
    helpCommand,
    dataCommand,
    randomPokemonCommand,
    searchcommand,
    verifyPsCommand,
    verifyTripCommand,
    psCommand,
    tripCommand,
    whoCommand,
  ];
};
