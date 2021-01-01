import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import { VerificationClient } from '../../verification';
import { UserStore } from '../../store/user';
import { ConfigurationStore } from '../../store/configuration';
import { BotSettings } from '../../settings';
import { createWhoIsCommand } from './who-is';
import { createWhoAmICommand } from './who-am-i';
import { createVerifyTripCommand } from './verify-trip';
import { createVerifyPsRoomCheckCommand } from './verify-ps-room-check';
import { createVerifyPsRoomCommand } from './verify-ps-room';
import { createVerifyPsCommand } from './verify-ps';
import { createUnverifyTripCommand } from './unverify-trip';
import { createUnverifyPsCommand } from './unverify-ps';
import { createTripCommand } from './trip';
import { registeredCommand as searchcommand } from './search';
import { createRefreshCommand } from './refresh';
import { registeredCommand as randomPokemonCommand } from './random-pokemon';
import { createPsCommand } from './ps';
import { createHelpCommand } from './help';
import { registeredCommand as dataCommand } from './data';

export const createCommands = (
  settings: BotSettings,
  configurationStore: ConfigurationStore,
  showdownVerificationClient: VerificationClient,
  yotsubaVerificationClient: VerificationClient,
  showdownRoomVerificationClient: VerificationClient<string[]>,
  showdownClient: PrettyClient,
  userStore: UserStore,
) => {
  const verifyPsCommand = createVerifyPsCommand(showdownVerificationClient);
  const verifyPsRoomCommand = createVerifyPsRoomCommand(showdownRoomVerificationClient);
  const verifyPsRoomCheckCommand = createVerifyPsRoomCheckCommand(
    showdownRoomVerificationClient,
    showdownClient,
  );
  const verifyTripCommand = createVerifyTripCommand(yotsubaVerificationClient);
  const whoAmICommand = createWhoAmICommand(userStore);
  const whoIsCommand = createWhoIsCommand(userStore);
  const psCommand = createPsCommand(userStore);
  const tripCommand = createTripCommand(userStore);
  const unverifyPsCommand = createUnverifyPsCommand(userStore);
  const unverifyTripCommand = createUnverifyTripCommand(userStore);
  const refreshCommand = createRefreshCommand(settings, configurationStore, userStore);
  const helpCommand = createHelpCommand([
    dataCommand,
    randomPokemonCommand,
    searchcommand,
    verifyPsCommand,
    verifyPsRoomCommand,
    verifyPsRoomCheckCommand,
    verifyTripCommand,
    unverifyPsCommand,
    unverifyTripCommand,
    psCommand,
    tripCommand,
    whoAmICommand,
    whoIsCommand,
    refreshCommand,
  ]);

  return [
    helpCommand,
    dataCommand,
    randomPokemonCommand,
    searchcommand,
    verifyPsCommand,
    verifyPsRoomCommand,
    verifyPsRoomCheckCommand,
    verifyTripCommand,
    unverifyPsCommand,
    unverifyTripCommand,
    psCommand,
    tripCommand,
    whoAmICommand,
    whoIsCommand,
    refreshCommand,
  ];
};
