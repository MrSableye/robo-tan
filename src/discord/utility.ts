import { MessageEmbed } from 'discord.js';
import { DogarsSet, setToString } from '../dogars';

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

const getPokemonImage = (set: DogarsSet, afd: boolean) => {
  if (afd) {
    return `https://play.pokemonshowdown.com/sprites/afd${(set.shiny && '-shiny') || ''}/${getNormalizedUniqueName(set.species)}.png`;
  }

  return `https://play.pokemonshowdown.com/sprites/xyani${(set.shiny && '-shiny') || ''}/${getNormalizedUniqueName(set.species)}.gif`;
};

const createMissingSetEmbed = () => new MessageEmbed()
  .setColor('RED')
  .setDescription('Set either does not exist or an unknown error occured.');

// eslint-disable-next-line import/prefer-default-export
export const createSetEmbed = (set?: DogarsSet): MessageEmbed => {
  if (!set) {
    return createMissingSetEmbed();
  }

  const setText = setToString(set);
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
    .setThumbnail(getPokemonImage(set, false))
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
