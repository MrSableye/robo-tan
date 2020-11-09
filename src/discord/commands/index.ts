import { registeredCommand as dataCommand } from './data';
import { registeredCommand as randomPokemonCommand } from './random-pokemon';
import { registeredCommand as searchcommand } from './search';

// eslint-disable-next-line import/prefer-default-export
export const registeredCommands = [
  dataCommand,
  randomPokemonCommand,
  searchcommand,
];
