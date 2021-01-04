import moment from 'moment';
import { User as DiscordUser, MessageEmbed } from 'discord.js';
import { User } from '../store/user';
import { toId } from '../showdown/utility';
import { DogarsSet, setToString } from '../dogars';

export const createErrorEmbed = (message: string) => new MessageEmbed()
  .setColor('RED')
  .setDescription(message);

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

export const createSetEmbed = (set?: DogarsSet): MessageEmbed => {
  if (!set) {
    return createErrorEmbed('Set either does not exist or an unknown error occured.');
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

export const createUserEmbed = (discordUser: DiscordUser, user: User) => {
  const author = `${user.isChamp ? '👑 ' : ''}${discordUser.username}#${discordUser.discriminator}`;
  const avatar = discordUser.avatarURL() || discordUser.defaultAvatarURL;

  const userEmbed = new MessageEmbed()
    .setAuthor(author, avatar);

  if (user.showdownIds) {
    userEmbed.addField(
      'Showdown',
      user.showdownIds.map(
        (showdownId) => `[${showdownId}](https://pokemonshowdown.com/users/${showdownId})`,
      ).join(', '),
    );
  }

  if (user.tripcode) {
    userEmbed.addField(
      '4chan',
      `[${user.tripcode}](https://archive.nyafuu.org/vp/search/tripcode/${user.tripcode})`,
    );
  }

  if (user.battles && user.champBattles && user.lastUpdated) {
    const formattedDate = moment(user.lastUpdated).subtract(2, 'weeks').format('MMM Do, YYYY');

    userEmbed.addField(
      'Stats',
      `Spectated ${user.battles} and champed ${user.champBattles - user.battles} since ${formattedDate}`,
    );
  }

  return userEmbed;
};
