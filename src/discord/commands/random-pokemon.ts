import { Message } from 'discord.js';
import { getRandomSetId, getSet } from '../../dogars';
import { RegisteredCommand } from '../types';
import { createSetEmbed } from '../utility';

export const handleRandomPokemon = async (message: Message) => {
  const randomSetId = await getRandomSetId();

  if (randomSetId) {
    const set = await getSet(randomSetId);

    if (set) {
      message.reply(createSetEmbed(set));
    }
  }

  // TOOD: Throw error / send error message if this occurs, shouldn
};

export const registeredCommand: RegisteredCommand = {
  commands: ['randpoke', 'randompokemon'],
  handler: handleRandomPokemon,
};
