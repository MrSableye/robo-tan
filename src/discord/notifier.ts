import { Client, MessageEmbed } from 'discord.js';
import { getCurrentBattlePost, getCurrentThread, Post } from '../showderp';

const createBattleLinkEmbed = (thread: Post, post: Post, battleLink: string) => new MessageEmbed()
  .setDescription(battleLink)
  .setURL(battleLink)
  .setThumbnail('http://play.pokemonshowdown.com/favicon-128.png')
  .setTimestamp(post.time * 1000)
  .setAuthor(
    `${post.name || ''} ${post.trip || ''}`,
    'https://i.imgur.com/3Ak7F4e.png',
    `https://boards.4channel.org/vp/thread/${thread.no}#p${post.no}`,
  );

// eslint-disable-next-line import/prefer-default-export
export const createBattleNotifier = (client: Client, channelId: string) => {
  let lastExecutedTime = -1;

  const intervalId = setInterval(async () => {
    const thread = await getCurrentThread();

    if (thread) {
      const battlePost = await getCurrentBattlePost(thread, lastExecutedTime);

      if (battlePost) {
        const [post, battleLink] = battlePost;
        const battleLinkEmbed = createBattleLinkEmbed(thread, post, battleLink);

        console.time(`Retrieved Discord channel ${channelId}`);
        const channel = await client.channels.fetch(channelId);
        console.timeEnd(`Retrieved Discord channel ${channelId}`);

        if (channel && channel.isText()) {
          console.time(`Sent message to channel ${channelId}`);
          const message = await channel.send(battleLinkEmbed);
          console.timeEnd(`Sent message to channel ${channelId}`);

          console.time('Set presence');
          await client.user?.setPresence({
            status: 'online',
            activity: {
              name: 'Pokémon Showdown',
              type: 'WATCHING',
              url: battleLink,
            },
          });
          console.timeEnd('Set presence');

          lastExecutedTime = post.time;

          console.time(`Crossposted message ${message.id}`);
          await message.crosspost();
          console.timeEnd(`Crossposted message ${message.id}`);
        }
      }
    }
  }, 1000 * 30);

  return intervalId;
};
