import Emittery from 'emittery';
import { Post } from '../types.js';
import { ConfigurationStore } from '../store/configuration/index.js';
import { getCatalog, getThread } from './yotsuba.js';

const showderpKeywords: string[] = ['showderp', 'dogars.ml', 'dogars.ga', 'dogars.org', 'showderp.fun', 'derp.show'];
const battleLinkPatterns: RegExp[] = [
  /(https?:\/\/)?play.pokemonshowdown.com\/(?<room>battle-[A-Za-b0-9]+-[A-Za-b0-9]+(-[A-Za-z0-9]+)?)/gi,
  /(https?:\/\/)?play.dogars.org\/(?<room>battle-[A-Za-b0-9]+-[A-Za-b0-9]+(-[A-Za-z0-9]+)?)/gi,
  /(https?:\/\/)?play.showderp.fun\/(?<room>battle-[A-Za-b0-9]+-[A-Za-b0-9]+(-[A-Za-z0-9]+)?)/gi,
  /(?<room>battle-[A-Za-b0-9]+-[A-Za-b0-9]+(-[A-Za-z0-9]+)?)/gi,
];
const incompleteLinkPattern = /(?<room>gen[A-Za-b0-9]+-[0-9]+(-[A-Za-z0-9]+pw)?)/gi;

const isShowderpThread = (post: Post) => {
  const comment = (post.com || '')
    .replace(/<wbr>/gm, '')
    .replace(/<(?:.|\n)*?>/gm, ' ')
    .toLowerCase();
  const subject = (post.sub || '')
    .replace(/<wbr>/gm, '')
    .replace(/<(?:.|\n)*?>/gm, ' ')
    .toLowerCase();
  const filename = (post.filename || '')
    .replace(/<wbr>/gm, '')
    .replace(/<(?:.|\n)*?>/gm, ' ')
    .toLowerCase();
  const doesCommentContainKeyword = showderpKeywords
    .some((keyword) => comment.includes(keyword));
  const doesSubjectContainKeyword = showderpKeywords
    .some((keyword) => subject.includes(keyword));
  const doesFilenameContainKeyword = showderpKeywords
    .some((keyword) => filename.includes(keyword));

  return doesCommentContainKeyword || doesSubjectContainKeyword || doesFilenameContainKeyword;
};

const getCurrentThreads = async (): Promise<Post[]> => {
  const catalog = await getCatalog('vp');

  return catalog
    .filter((thread) => isShowderpThread(thread));
};

export type ShowderpMonitor = Emittery<{
  thread: Post,
  battlePost: [Post, Post, string],
}>;

type ThreadPostsPair = [Post, Post[]];
type ThreadPostPair = [Post, Post];

export const createShowderpMonitor = async (
  frequency: number,
  configurationStore: ConfigurationStore,
) => {
  const showderpMonitor: ShowderpMonitor = new Emittery<{
    thread: Post,
    battlePost: [Post, Post, string],
  }>();

  let lastExecutedTime: number | undefined = await configurationStore.getGlobalConfigurationValue('lastExecutedTime');
  let currentThreadNo: number | undefined = await configurationStore.getGlobalConfigurationValue('currentThread');

  const timeout = setInterval(async () => {
    const currentThreads = (await getCurrentThreads()).sort((a, b) => a.no - b.no);

    await Promise.all(currentThreads.map(async (currentThread) => {
      if (!currentThreadNo || currentThread.no > currentThreadNo) {
        currentThreadNo = await configurationStore.setGlobalConfigurationValue(
          'currentThread',
          currentThread.no,
        );

        showderpMonitor.emit('thread', currentThread);
      }
    }));

    const showderpPosts = (await Promise.all(currentThreads.map(async (currentThread) => {
      const posts = await getThread('vp', currentThread.no);

      return [currentThread, posts] as ThreadPostsPair;
    })))
      .reduce((threadPostPairs: ThreadPostPair[], [thread, posts]) => {
        const mappedPosts = posts.map((post) => ([thread, post] as ThreadPostPair));
        const result = [...threadPostPairs, ...mappedPosts];

        return result;
      }, [])
      .sort((a, b) => a[1].no - b[1].no);

    let latestExecutionTime = lastExecutedTime || -1;

    showderpPosts.forEach(([showderpThread, showderpPost]) => {
      latestExecutionTime = Math.max(latestExecutionTime, showderpPost.time);

      if (!lastExecutedTime || (showderpPost.time > lastExecutedTime)) {
        if (showderpPost.trip && showderpPost.com) {
          const comment = showderpPost.com
            .replace(/<wbr>/gm, '')
            .replace(/<(?:.|\n)*?>/gm, '')
            .replace(/\s/gm, '');

          const rooms: Record<string, boolean> = {};

          battleLinkPatterns.forEach((battleLinkPattern) => {
            const matches = [...comment.matchAll(battleLinkPattern)];

            matches.forEach((match) => {
              if (match?.groups?.room) {
                rooms[(match?.groups?.room || '')] = true;
              }
            });
          });

          const matches = [...comment.matchAll(incompleteLinkPattern)];
          matches.forEach((match) => {
            if (match?.groups?.room) {
              rooms[`battle-${match?.groups?.room || ''}`] = true;
            }
          });

          Object.keys(rooms).forEach((room) => {
            showderpMonitor.emit('battlePost', [
              showderpThread,
              showderpPost,
              room,
            ]);
          });
        }
      }
    });

    lastExecutedTime = await configurationStore.setGlobalConfigurationValue(
      'lastExecutedTime',
      latestExecutionTime,
    );
  }, frequency);

  return {
    timeout,
    showderpMonitor,
  };
};
