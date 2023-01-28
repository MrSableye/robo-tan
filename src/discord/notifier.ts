import { Client, EmbedBuilder } from 'discord.js';
import { Post } from '../types.js';
import { log, logExecution } from '../logger.js';

const DISCORD_LOG_PREFIX = 'DISCORD';

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
  try {
    const channel = await logExecution(
      DISCORD_LOG_PREFIX,
      `Retrieving channel ${channelId}`,
      `Retrieved channel ${channelId}`,
      async () => await client.channels.fetch(channelId),
    );

    if (channel && channel.isTextBased()) {
      const threadEmbed = createThreadEmbed(thread);

      const message = await logExecution(
        DISCORD_LOG_PREFIX,
        `Sending message to channel ${channelId}`,
        `Sent message to channel ${channelId}`,
        async () => await channel.send({ embeds: [threadEmbed] }),
      );

      await logExecution(
        DISCORD_LOG_PREFIX,
        `Crossposting message ${message.id}`,
        `Crossposted message ${message.id}`,
        async () => await message.crosspost(),
      );
    }
  } catch (error) {
    log(DISCORD_LOG_PREFIX, (error as Error)?.message, true);
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
    name: 'Showderp Link (preferred)',
    value: `[https://play.showderp.fun/${battleRoom}](https://play.showderp.fun/${battleRoom})`,
  })
  .addFields({
    name: 'Showdown Link (not recommended)',
    value: `[https://play.pokemonshowdown.com/${battleRoom}](https://play.pokemonshowdown.com/${battleRoom})`,
  });

export type BattlePostEvent = [Post, Post, string]; // TODO: Export this in a better place

export const createBattlePostHandler = (
  client: Client, channelId: string,
) => async (battlePostEvent: BattlePostEvent) => {
  try {
    const [thread, battlePost, battleRoom] = battlePostEvent;

    const channel = await logExecution(
      DISCORD_LOG_PREFIX,
      `Retrieving channel ${channelId}`,
      `Retrieved channel ${channelId}`,
      async () => await client.channels.fetch(channelId),
    );

    if (channel && channel.isTextBased()) {
      const battlePostEmbed = createBattlePostEmbed(
        thread,
        battlePost,
        battleRoom,
      );

      const message = await logExecution(
        DISCORD_LOG_PREFIX,
        `Sending message to channel ${channelId}`,
        `Sent message to channel ${channelId}`,
        async () => await channel.send({ embeds: [battlePostEmbed] }),
      );

      await logExecution(
        DISCORD_LOG_PREFIX,
        `Crossposting message ${message.id}`,
        `Crossposted message ${message.id}`,
        async () => await message.crosspost(),
      );
    }
  } catch (error) {
    log(DISCORD_LOG_PREFIX, (error as Error)?.message, true);
  }
};
