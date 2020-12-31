import { Message } from 'discord.js';
import { createSetEmbed } from '../utility';
import { RegisteredCommand } from '../types';
import { advancedSearchSets } from '../../dogars';

export const handleSearch = async (message: Message, commandText: string) => {
  const parameters = commandText.split(',').reduce((currentParameters: { [key: string]: string }, parameter) => {
    if (parameter.indexOf(':') >= 0) {
      const [parameterName, parameterValue] = parameter.trim().split(':').map((value) => value.trim().toLowerCase());

      if (parameterName && parameterValue) {
        return { ...currentParameters, [parameterName]: parameterValue };
      }
    }

    return currentParameters;
  }, {});

  const advancedSearchPage = await advancedSearchSets(parameters);

  if (advancedSearchPage) {
    const [, sets] = advancedSearchPage;

    return message.reply(createSetEmbed(sets[0]));
  }

  return message.reply(createSetEmbed(undefined));
};

export const registeredCommand: RegisteredCommand = {
  commands: ['search'],
  handler: handleSearch,
  help: [
    {
      name: '!search <filterName:filterValue>,...',
      value: 'Displays the first set found when searching given the search filters\nExample: `!search name:fastpoke,species:slowpoke`',
      inline: false,
    },
  ],
};
