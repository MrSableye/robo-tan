import Emittery from 'emittery';
import { CatalogThread, getCatalog, getThread, Post } from './yotsuba';

const showderpKeywords: string[] = ['showderp', 'dogars.ml', 'dogars.ga'];
const showdownBattleLinkPattern: RegExp = /(https?:\/\/)?play.pokemonshowdown.com\/battle-([^\s]*)/gi;

const isShowderpThread = (post: Post) => {
  const doesCommentContainKeyword = showderpKeywords
    .some((keyword) => post.com && post.com.includes(keyword));
  const doesSubjectContainKeyword = showderpKeywords
    .some((keyword) => post.sub && post.sub.includes(keyword));

  return doesCommentContainKeyword || doesSubjectContainKeyword;
};

const getCurrentThread = async (): Promise<Post | undefined> => {
  const catalog = await getCatalog('vp');

  return catalog.reduce((currentThread: CatalogThread | undefined, thread) => {
    if (isShowderpThread(thread)) {
      const threadPosts = [thread, ...thread.last_replies];
      const lastPost = threadPosts[threadPosts.length - 1];

      if (!currentThread || (lastPost.no > currentThread.no)) {
        return thread;
      }
    }

    return currentThread;
  }, undefined);
};

interface ScanThreadResult {
  newBattlePost?: [Post, string];
  newChallengePosts: Post[];
}

const scanThread = (
  thread: Post[],
  lastExecutedTime?: number,
): ScanThreadResult => thread.reverse()
  .reduce((scanThreadResult: ScanThreadResult, post) => {
    if (!lastExecutedTime || (post.time > lastExecutedTime)) {
      if (!scanThreadResult.newBattlePost) {
        if (post.trip && post.com) {
          const comment = post.com
            .replace(/<wbr>/gm, '')
            .replace(/<(?:.|\n)*?>/gm, ' ');

          const matches = comment.match(showdownBattleLinkPattern);

          if (matches && matches.length > 0) {
            const link = matches.pop() as string;

            /* eslint-disable no-param-reassign */
            scanThreadResult.newBattlePost = [
              post,
              link[0] === 'h' ? link : `https://${link}`,
            ];
            /* eslint-enable no-param-reassign */
          }
        }
      }

      if (post.trip && post.name && post.name.startsWith('VerifyUser')) {
        scanThreadResult.newChallengePosts.push(post);
      }
    }

    return scanThreadResult;
  }, { newChallengePosts: [] });

export type ShowdownMonitor = Emittery.Typed<{
  thread: Post,
  battlePost: [Post, Post, string],
  challengePosts: Post[],
}>;

export const createShowderpMonitor = (frequency: number): [NodeJS.Timeout, ShowdownMonitor] => {
  const showdownEventEmitter: ShowdownMonitor = new Emittery.Typed<{
    thread: Post,
    battlePost: [Post, Post, string],
    challengePosts: Post[],
  }>();

  let lastExecutedTime: number | undefined;
  let currentThread: Post | undefined;
  let currentBattlePost: [Post, string] | undefined;

  const timeout = setInterval(async () => {
    const thread = await getCurrentThread();

    if (thread && (thread.no !== currentThread?.no)) {
      currentThread = thread;
      showdownEventEmitter.emit('thread', currentThread);
    }

    if (thread) {
      const threadPosts = await getThread('vp', thread.no);
      const { newBattlePost, newChallengePosts } = scanThread([...threadPosts], lastExecutedTime);

      if (newBattlePost && (newBattlePost[0].no !== currentBattlePost?.[0].no)) {
        currentBattlePost = newBattlePost;
        showdownEventEmitter.emit('battlePost', [thread, ...currentBattlePost]);
      }

      if (newChallengePosts.length > 0) {
        showdownEventEmitter.emit('challengePosts', newChallengePosts);
      }

      lastExecutedTime = threadPosts[threadPosts.length - 1].time;
    }
  }, frequency);

  return [timeout, showdownEventEmitter];
};
