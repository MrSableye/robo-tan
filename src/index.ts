import { Client, Message, MessageEmbed } from 'discord.js';
import {
  advancedSearch,
  DogarsSet,
  getSet,
  randomSet,
  searchSet,
} from './dogars';

const token = process.env.TOKEN || '';

const client = new Client();
client.login(token);

const toId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');

const getNormalizedUniqueName = (species: string) => {
  const h = species.indexOf('-');
  if (h === -1) {
    return toId(species);
  }

  if (species.toLowerCase() === 'kommo-o') {
    return 'kommoo';
  }

  return `${toId(species.substr(0, h).toLowerCase())}-${toId(species.substr(h + 1))}`;
};

const getPokemonImage = (set: DogarsSet) => `https://play.pokemonshowdown.com/sprites/xyani${(set.shiny === 1 && '-shiny') || ''}/${getNormalizedUniqueName(set.species)}.gif`;

const createSetEmbed = (set: DogarsSet, setText: string) => {
  const author = `${set.creator || 'Anonymous'} ${set.hash ? ` !${set.hash}` : ''}`;
  const params = new URLSearchParams();

  params.set('page', '1');

  if (set.creator) {
    params.set('creator', set.creator);
  }

  if (set.hash) {
    params.set('hash', set.hash);
  }

  const authorLink = `https://dogars.ga/results?${params.toString()}`;

  let embed = new MessageEmbed()
    .setTitle(set.name || set.species)
    .setAuthor(author, 'https://dogars.ga/img/icons/favicon-32x32.png', (set.creator || set.hash) ? authorLink : undefined)
    .setURL(`https://dogars.ga/set/${set.id}`)
    .setThumbnail(getPokemonImage(set))
    .setTimestamp(set.date_added)
    .setFooter(`Format: ${set.format}`);

  if (set.description) {
    embed = embed.addField('Description', set.description);
  }

  if (set.has_custom === 1) {
    embed = embed.setImage(`https://dogars.ga/api/custom/${set.id}`);
  }

  embed = embed.addField('Set', `\`\`\`${setText}\`\`\``);

  return embed;
};

const replyWithError = (message: Message) => {
  message.reply(
    new MessageEmbed()
      .setColor('RED')
      .setDescription('Set either does not exist or an unknown error occured.'),
  );
};

client.on('message', async (msg) => {
  if (msg.content.startsWith('!dt')) {
    const content = msg.content.substr(3).trim();

    if (content.match(/^[0-9]+$/)) {
      const contentAsId = parseInt(content, 10);

      const getSetResponse = await getSet(contentAsId);

      if (getSetResponse) {
        const [set, setText] = getSetResponse;

        msg.reply(createSetEmbed(set, setText));
      } else {
        replyWithError(msg);
      }
    } else {
      const searchSetResponse = await searchSet(content);

      if (searchSetResponse) {
        const [set, setText] = searchSetResponse;

        msg.reply(createSetEmbed(set, setText));
      } else {
        replyWithError(msg);
      }
    }
  } else if (msg.content.startsWith('!randpoke')) {
    const randomSetResponse = await randomSet();

    if (randomSetResponse) {
      const [set, setText] = randomSetResponse;

      msg.reply(createSetEmbed(set, setText));
    } else {
      replyWithError(msg);
    }
  } else if (msg.content.startsWith('Hi Dogars-nyan!')) {
    msg.reply(`Hi ${msg.member?.nickname || msg.author.username}`);
  } else if (msg.content.startsWith('!search')) {
    const content = msg.content.substr(7).trim();

    const parameters = content.split(',').reduce((currentParameters: { [key: string]: string }, parameter) => {
      if (parameter.indexOf(':') >= 0) {
        const [parameterName, parameterValue] = parameter.trim().split(':').map((value) => value.trim());

        currentParameters[parameterName] = parameterValue;
      }

      return currentParameters;
    }, {});

    const advancedSearchResult = await advancedSearch(parameters);

    if (advancedSearchResult) {
      const [set, setText] = advancedSearchResult;

      msg.reply(createSetEmbed(set, setText));
    }
  }
});
