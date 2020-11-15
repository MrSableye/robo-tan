import { Client, MessageEmbed } from 'discord.js';
import { Post } from '../showderp';
import { VerificationClient } from '../verification';
import { ChallengeType } from '../verification/store';

const createThreadEmbed = (thread: Post) => new MessageEmbed()
  .setAuthor(
    thread.sub || 'New Showderp Thread',
    'https://i.imgur.com/3Ak7F4e.png',
    `https://boards.4channel.org/vp/thread/${thread.no}`,
  );

export const createThreadHandler = (client: Client, channelId: string) => async (thread: Post) => {
  console.time(`Retrieved Discord channel ${channelId}`);
  const channel = await client.channels.fetch(channelId);
  console.timeEnd(`Retrieved Discord channel ${channelId}`);

  if (channel && channel.isText()) {
    const threadEmbed = createThreadEmbed(thread);

    console.time(`Sent message to channel ${channelId}`);
    const message = await channel.send(threadEmbed);
    console.timeEnd(`Sent message to channel ${channelId}`);

    console.time(`Crossposted message ${message.id}`);
    await message.crosspost();
    console.timeEnd(`Crossposted message ${message.id}`);
  }
};

const createBattlePostEmbed = (thread: Post, post: Post, battleLink: string) => new MessageEmbed()
  .setDescription(battleLink)
  .setURL(battleLink)
  .setThumbnail('http://play.pokemonshowdown.com/favicon-128.png')
  .setTimestamp(post.time * 1000)
  .setAuthor(
    `${post.name || ''} ${post.trip || ''}`,
    'https://i.imgur.com/3Ak7F4e.png',
    `https://boards.4channel.org/vp/thread/${thread.no}#p${post.no}`,
  );

type BattlePostEvent = [Post, Post, string];

export const createBattlePostHandler = (
  client: Client, channelId: string,
) => async (battlePostEvent: BattlePostEvent) => {
  const [thread, battlePost, battleLink] = battlePostEvent;

  console.time(`Retrieved Discord channel ${channelId}`);
  const channel = await client.channels.fetch(channelId);
  console.timeEnd(`Retrieved Discord channel ${channelId}`);

  if (channel && channel.isText()) {
    const battlePostEmbed = createBattlePostEmbed(
      thread,
      battlePost,
      battleLink,
    );

    console.time(`Sent message to channel ${channelId}`);
    const message = await channel.send(battlePostEmbed);
    console.timeEnd(`Sent message to channel ${channelId}`);

    console.time(`Crossposted message ${message.id}`);
    await message.crosspost();
    console.timeEnd(`Crossposted message ${message.id}`);
  }
};

export const createChallengePostHandler = (
  client: Client,
  verificationClient: VerificationClient,
) => async (challengePosts: Post[]) => {
  challengePosts.map(async (challengePost) => {
    const user = await verificationClient.verifyChallengeAndUpdateUser(
      (challengePost.name || '').substr(10),
      ChallengeType.YOTSUBA,
      { tripcode: challengePost.trip || '' },
    );

    if (user) {
      const discordUser = await client.users.fetch(user.discordId);

      discordUser.send(`Successfully validated tripcode: ${challengePost.trip}`);
    }
  });
};
