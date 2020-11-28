import Emittery from 'emittery';
import {
  CatalogThread,
  getCatalog,
  getThread,
  Post,
} from './yotsuba';
import { ConfigurationStore } from '../configuration';

const showderpKeywords: string[] = ['showderp', 'dogars.ml', 'dogars.ga'];
const battleLinkPatterns: RegExp[] = [
  /(https?:\/\/)?play.pokemonshowdown.com\/(?<room>battle-([^\s]*))/gi,
  /(https?:\/\/)?play.dogars.ga\/(?<room>battle-([^\s]*))/gi,
];

const isShowderpThread = (post: Post) => {
  const comment = (post.com || '')
    .replace(/<wbr>/gm, '')
    .replace(/<(?:.|\n)*?>/gm, ' ')
    .toLowerCase();
  const subject = (post.sub || '')
    .replace(/<wbr>/gm, '')
    .replace(/<(?:.|\n)*?>/gm, ' ')
    .toLowerCase();
  const doesCommentContainKeyword = showderpKeywords
    .some((keyword) => comment.includes(keyword));
  const doesSubjectContainKeyword = showderpKeywords
    .some((keyword) => subject.includes(keyword));

  return doesCommentContainKeyword || doesSubjectContainKeyword;
};

const getCurrentThread = async (): Promise<Post | undefined> => {
  const catalog = await getCatalog('vp');

  return catalog.reduce((currentThread: CatalogThread | undefined, thread) => {
    if (isShowderpThread(thread) && thread.bumplimit !== 1) {
      const threadPosts = [thread, ...thread.last_replies];
      const lastPost = threadPosts[threadPosts.length - 1];

      if (!currentThread) {
        return thread;
      }

      const currentThreadPosts = [currentThread, ...currentThread.last_replies];
      const currentThreadLastPost = currentThreadPosts[currentThreadPosts.length - 1];

      if (lastPost.no > currentThreadLastPost.no) {
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

          battleLinkPatterns.forEach((battleLinkPattern) => {
            const matches = battleLinkPattern.exec(comment);

            if (matches?.groups?.['room']) {
              /* eslint-disable no-param-reassign */
              scanThreadResult.newBattlePost = [
                post,
                matches?.groups?.['room'],
              ];
              /* eslint-enable no-param-reassign */
            }
          });
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

export const createShowderpMonitor = async (
  frequency: number,
  configurationStore: ConfigurationStore,
): Promise<[NodeJS.Timeout, ShowdownMonitor]> => {
  const showdownEventEmitter: ShowdownMonitor = new Emittery.Typed<{
    thread: Post,
    battlePost: [Post, Post, string],
    challengePosts: Post[],
  }>();

  let lastExecutedTime: number | undefined = await configurationStore.getGlobalConfigurationValue('lastExecutedTime');
  let currentThread: number | undefined = await configurationStore.getGlobalConfigurationValue('currentThread');
  let currentBattlePost: [Post, string] | undefined;

  const timeout = setInterval(async () => {
    const thread = await getCurrentThread();

    if (thread && (thread.no !== currentThread)) {
      currentThread = await configurationStore.setGlobalConfigurationValue(
        'currentThread',
        thread.no,
      );
      showdownEventEmitter.emit('thread', thread);
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

      lastExecutedTime = await configurationStore.setGlobalConfigurationValue(
        'lastExecutedTime',
        threadPosts[threadPosts.length - 1].time,
      );
    }
  }, frequency);

  return [timeout, showdownEventEmitter];
};
