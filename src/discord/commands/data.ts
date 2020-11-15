import { Message } from 'discord.js';
import { getSet, searchSets } from '../../dogars';
import { RegisteredCommand } from '../types';
import { createSetEmbed } from '../utility';

export const handleData = async (message: Message, commandText: string) => {
  if (commandText.match(/^[0-9]+$/)) {
    const setId = parseInt(commandText, 10);

    if (!Number.isNaN(setId)) {
      const set = await getSet(setId);

      return message.reply(createSetEmbed(set));
    }
  } else {
    const searchPage = await searchSets(commandText);

    if (searchPage) {
      const [, sets] = searchPage;

      return message.reply(createSetEmbed(sets[0]));
    }
  }

  return message.reply(createSetEmbed());
};

export const registeredCommand: RegisteredCommand = {
  commands: ['dt', 'data'],
  handler: handleData,
  help: [
    {
      name: '!dt <setId>',
      value: 'Displays the set with given set id\nExample: `!dt 8143`',
      inline: false,
    },
    {
      name: '!dt <searchQuery>',
      value: 'Displays the first set found when searching for the search query\nExample: `!dt fastpoke`',
      inline: false,
    },
  ],
};
