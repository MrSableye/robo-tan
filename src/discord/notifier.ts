import { Client, MessageEmbed } from 'discord.js';
import { VerificationClient } from '../verification';
import { ChallengeType } from '../store/challenge';
import { Post } from '../showderp';

const createThreadEmbed = (thread: Post) => {
  const messageEmbed = new MessageEmbed()
    .setAuthor(
      thread.sub || 'New Showderp Thread',
      'https://i.imgur.com/3Ak7F4e.png',
      `https://boards.4channel.org/vp/thread/${thread.no}`,
    );

  if (thread.tim && thread.ext) {
    messageEmbed.setImage(`https://is2.4chan.org/vp/${thread.tim}${thread.ext}`);
  }

  return messageEmbed;
};

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

const createBattlePostEmbed = (thread: Post, post: Post, battleRoom: string) => new MessageEmbed()
  .setThumbnail('http://play.pokemonshowdown.com/favicon-128.png')
  .setTimestamp(post.time * 1000)
  .setAuthor(
    `${post.name || ''} ${post.trip || ''}`,
    'https://i.imgur.com/3Ak7F4e.png',
    `https://boards.4channel.org/vp/thread/${thread.no}#p${post.no}`,
  )
  .addFields({
    name: 'Dogars Link (preferred)',
    value: `[https://play.dogars.ga/${battleRoom}](https://play.dogars.ga/${battleRoom})`,
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

  if (channel && channel.isText()) {
    const battlePostEmbed = createBattlePostEmbed(
      thread,
      battlePost,
      battleRoom,
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
      (userToUpdate) => ({
        ...userToUpdate,
        tripcode: challengePost.trip || '',
      }),
    );

    if (user) {
      const discordUser = await client.users.fetch(user.discordId);

      discordUser.send(`Successfully validated tripcode: ${challengePost.trip}`);
    }
  });
};
