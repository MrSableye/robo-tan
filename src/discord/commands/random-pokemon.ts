import { Message } from 'discord.js';
import { advancedSearchSets, getRandomSetId, getSet } from '../../dogars';
import { RegisteredCommand } from '../types';
import { createSetEmbed } from '../utility';

export const handleRandomPokemon = async (message: Message, commandText: string) => {
  const parameters = commandText.split(',').reduce((currentParameters: { [key: string]: string }, parameter) => {
    if (parameter.indexOf(':') >= 0) {
      const [parameterName, parameterValue] = parameter.trim().split(':').map((value) => value.trim().toLowerCase());

      return { ...currentParameters, [parameterName]: parameterValue };
    }

    return currentParameters;
  }, {});

  if (Object.keys(parameters).length > 0) {
    const advancedSearchPage = await advancedSearchSets(parameters, true);

    if (advancedSearchPage) {
      const [, sets] = advancedSearchPage;

      return message.reply(createSetEmbed(sets[0]));
    }
  } else {
    const randomSetId = await getRandomSetId();

    if (randomSetId) {
      const set = await getSet(randomSetId);

      if (set) {
        return message.reply(createSetEmbed(set));
      }
    }
  }

  return message.reply(createSetEmbed(undefined));
};

export const registeredCommand: RegisteredCommand = {
  commands: ['randpoke', 'randompokemon'],
  handler: handleRandomPokemon,
  help: [
    {
      name: '!randpoke',
      value: 'Displays a random set\nExample: `!randpoke`',
      inline: false,
    },
    {
      name: '!randpoke <filterName:filterValue>,...',
      value: 'Displays a random set with the given search filters\nExample: `!randpoke name:fastpoke,species:slowpoke`',
      inline: false,
    },
  ],
};
