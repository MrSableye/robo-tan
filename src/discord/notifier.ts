import { Client, EmbedBuilder } from 'discord.js';
import { Post } from '../types.js';

const createThreadEmbed = (thread: Post) => {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: thread.sub || 'New Showderp Thread',
      iconURL: 'https://i.imgur.com/3Ak7F4e.png',
      url: `https://boards.4channel.org/vp/thread/${thread.no}`,
    });

  if (thread.tim && thread.ext) {
    embed.setImage(`https://is2.4chan.org/vp/${thread.tim}${thread.ext}`);
  }

  return embed;
};

export const createThreadHandler = (client: Client, channelId: string) => async (thread: Post) => {
  console.time(`Retrieved Discord channel ${channelId}`);
  const channel = await client.channels.fetch(channelId);
  console.timeEnd(`Retrieved Discord channel ${channelId}`);

  if (channel && channel.isTextBased()) {
    const threadEmbed = createThreadEmbed(thread);

    console.time(`Sent message to channel ${channelId}`);
    const message = await channel.send({ embeds: [threadEmbed] });
    console.timeEnd(`Sent message to channel ${channelId}`);

    console.time(`Crossposted message ${message.id}`);
    await message.crosspost();
    console.timeEnd(`Crossposted message ${message.id}`);
  }
};

const createBattlePostEmbed = (thread: Post, post: Post, battleRoom: string) => new EmbedBuilder()
  .setThumbnail('http://play.pokemonshowdown.com/favicon-128.png')
  .setTimestamp(post.time * 1000)
  .setAuthor({
    name: `${post.name || ''} ${post.trip || ''}`,
    iconURL: 'https://i.imgur.com/3Ak7F4e.png',
    url: `https://boards.4channel.org/vp/thread/${thread.no}#p${post.no}`,
  })
  .addFields({
    name: 'Dogars Link (preferred)',
    value: `[https://play.dogars.org/${battleRoom}](https://play.dogars.org/${battleRoom})`,
  })
  .addFields({
    name: 'Showdown Link (not recommended)',
    value: `[https://play.pokemonshowdown.com/${battleRoom}](https://play.pokemonshowdown.com/${battleRoom})`,
  });

export type BattlePostEvent = [Post, Post, string]; // TODO: Export this in a better place

export const createBattlePostHandler = (
  client: Client, channelId: string,
) => async (battlePostEvent: BattlePostEvent) => {
  const [thread, battlePost, battleRoom] = battlePostEvent;

  console.time(`Retrieved Discord channel ${channelId}`);
  const channel = await client.channels.fetch(channelId);
  console.timeEnd(`Retrieved Discord channel ${channelId}`);

  if (channel && channel.isTextBased()) {
    const battlePostEmbed = createBattlePostEmbed(
      thread,
      battlePost,
      battleRoom,
    );

    console.time(`Sent message to channel ${channelId}`);
    const message = await channel.send({ embeds: [battlePostEmbed] });
    console.timeEnd(`Sent message to channel ${channelId}`);

    console.time(`Crossposted message ${message.id}`);
    await message.crosspost();
    console.timeEnd(`Crossposted message ${message.id}`);
  }
};
