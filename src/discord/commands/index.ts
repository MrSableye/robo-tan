import { registeredCommand as dataCommand } from './data';
import { registeredCommand as randomPokemonCommand } from './random-pokemon';
import { registeredCommand as searchcommand } from './search';
import { createHelpCommand } from './help';

const helpCommand = createHelpCommand([dataCommand, randomPokemonCommand, searchcommand]);

// eslint-disable-next-line import/prefer-default-export
export const registeredCommands = [
  helpCommand,
  dataCommand,
  randomPokemonCommand,
  searchcommand,
];
