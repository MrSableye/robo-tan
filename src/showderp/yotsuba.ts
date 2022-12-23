import axios from 'axios';
import { CatalogPage, Thread } from '../types.js';
import { log, logExecution } from '../logger.js';

const YOTSUBA_LOG_PREFIX = 'YOTSUBA';

export const getCatalog = async (board: string) => {
  try {
    const response = await logExecution(
      YOTSUBA_LOG_PREFIX,
      `Retrieving /${board}/ catalog`,
      `Retrieved /${board}/ catalog`,
      async () => await axios.get<CatalogPage[]>(`https://a.4cdn.org/${board}/catalog.json`, {
        responseType: 'json',
        headers: { 'Accept-Encoding': '*' },
      }),
    );

    return response.data.flatMap((page) => page.threads);
  } catch (error) {
    log(YOTSUBA_LOG_PREFIX, (error as Error)?.message, true);

    return [];
  }
};

export const getThread = async (board: string, postNumber: number) => {
  try {
    const response = await logExecution(
      YOTSUBA_LOG_PREFIX,
      `Retrieving /${board}/ catalog`,
      `Retrieved /${board}/ catalog`,
      async () => await axios.get<Thread>(`https://a.4cdn.org/${board}/thread/${postNumber}.json`, {
        responseType: 'json',
        headers: { 'Accept-Encoding': '*' },
      }),
    );

    return response.data.posts;
  } catch (error) {
    log(YOTSUBA_LOG_PREFIX, (error as Error)?.message, true);

    return [];
  }
};
