import { Message } from 'discord.js';
import { getSet, searchSets } from '../../dogars';
import { RegisteredCommand } from '../types';
import { createSetEmbed } from '../utility';

export const handleData = async (message: Message, commandText: string) => {
  if (commandText.match(/^[0-9]+$/)) {
    const setId = parseInt(commandText, 10);

    if (Number.isNaN(setId)) {
      // TODO: Throw error if this occurs
    } else {
      const set = await getSet(setId);

      message.reply(createSetEmbed(set));
    }
  } else {
    const searchPage = await searchSets(commandText);

    if (searchPage) {
      const [, sets] = searchPage;

      message.reply(createSetEmbed(sets[0]));
    } else {
      // TODO: Throw error if this occurs
    }
  }
};

export const registeredCommand: RegisteredCommand = {
  commands: ['dt', 'data'],
  handler: handleData,
};
