import { Message } from 'discord.js';
import { advancedSearchSets, getRandomSetId, getSet } from '../../dogars';
import { RegisteredCommand } from '../types';
import { createSetEmbed } from '../utility';

export const handleRandomPokemon = async (message: Message, commandText: string) => {
  const parameters = commandText.split(',').reduce((currentParameters: { [key: string]: string }, parameter) => {
    if (parameter.indexOf(':') >= 0) {
      const [parameterName, parameterValue] = parameter.trim().split(':').map((value) => value.trim());

      return { ...currentParameters, [parameterName]: parameterValue };
    }

    return currentParameters;
  }, {});

  if (Object.keys(parameters).length > 0) {
    const advancedSearchPage = await advancedSearchSets(parameters, true);

    if (advancedSearchPage) {
      const [, sets] = advancedSearchPage;

      message.reply(createSetEmbed(sets[0]));
    }
  } else {
    const randomSetId = await getRandomSetId();

    if (randomSetId) {
      const set = await getSet(randomSetId);

      if (set) {
        message.reply(createSetEmbed(set));
      }
    }
  }
  // TOOD: Throw error / send error message if this occurs, shouldn
};

export const registeredCommand: RegisteredCommand = {
  commands: ['randpoke', 'randompokemon'],
  handler: handleRandomPokemon,
};
