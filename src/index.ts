import { Client, MessageEmbed } from 'discord.js';
import { DogarsSet, getSet, randomSet, searchSet } from './dogars';

const token = process.env.TOKEN || '';

const client = new Client();
client.login(token);

client.on('message', async (msg) => {
  if (msg.content.startsWith('!dt')) {
    const content = msg.content.substr(3).trim();
    const contentAsId = parseInt(content);

    if (isNaN(contentAsId)) {
      const [set, setText] = await searchSet(content);

      msg.reply(createSetEmbed(set, setText));
    } else {
      const [set, setText] = await getSet(contentAsId);

      msg.reply(createSetEmbed(set, setText));
    }
  } else if (msg.content.startsWith('!randpoke')) {
    const [set, setText] = await randomSet();

    msg.reply(createSetEmbed(set, setText));
  }
});

export let toId = (text: any) => {
  if (text && text.id) {
      text = text.id;
  } else if (text && text.userid) {
      text = text.userid;
  }
  if (typeof text !== 'string' && typeof text !== 'number') return '';
  return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
};

let getNormalizedUniqueName = (species: string) => {
  let h = species.indexOf('-');
  if (h == -1)
      return toId(species);
  if (species.toLowerCase() == "kommo-o")
      return "kommoo";
  return `${toId(species.substr(0, h).toLowerCase())}-${toId(species.substr(h + 1))}`;
};

export const getPokemonImage = (set: DogarsSet) => {
  return `https://play.pokemonshowdown.com/sprites/xyani${(set.shiny === 1 && '-shiny') || ''}/${getNormalizedUniqueName(set.species)}.gif`;
}

const createSetEmbed = (set: DogarsSet, setText: string) => {
  const author = `${set.creator || 'Anonymous'} ${set.hash ? ' !' + set.hash : ''}`;

  let embed = new MessageEmbed()
    .setTitle(set.name || set.species)
    .setAuthor(author, 'https://dogars.ga/img/icons/favicon-32x32.png')
    .setURL(`https://dogars.ga/set/${set.id}`)
    .setThumbnail(getPokemonImage(set))
    .setTimestamp(set.date_added)
    .setFooter(`Format: ${set.format}`);

  if (set.description) {
    embed = embed.addField('Description', set.description);
  }

  embed = embed.addField('Set', `\`\`\`${setText}\`\`\``);

  return embed;
};