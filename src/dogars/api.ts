import axios from 'axios';
import { DogarsPage, DogarsSet } from '../types.js';
import { log } from '../logger.js';

const DOGARS_API_LOG_PREFIX = 'DOGARS_API';

export const getSet = async (id: number): Promise<DogarsSet | undefined> => {
  try {
    return (await axios.get<DogarsSet>(`https://dogars.org/api/sets/${id}`, {
      responseType: 'json',
      headers: { 'Accept-Encoding': '*' },
    })).data;
  } catch (error) {
    log(DOGARS_API_LOG_PREFIX, (error as Error)?.message, true);

    return undefined;
  }
};

export const getRandomSetId = async () => {
  try {
    return (await axios.get<number>('https://dogars.org/api/random', {
      responseType: 'json',
      headers: { 'Accept-Encoding': '*' },
    })).data;
  } catch (error) {
    log(DOGARS_API_LOG_PREFIX, (error as Error)?.message, true);

    return undefined;
  }
};

export const searchSets = async (query: string): Promise<DogarsPage | undefined> => {
  try {
    return (await axios.get<DogarsPage>('https://dogars.org/api/search', {
      responseType: 'json',
      params: { q: query, page: 1 },
      headers: { 'Accept-Encoding': '*' },
    })).data;
  } catch (error) {
    log(DOGARS_API_LOG_PREFIX, (error as Error)?.message, true);

    return undefined;
  }
};

export const advancedSearchSets = async (
  queries: { [key: string]: string },
  isRandom: boolean = false,
): Promise<DogarsPage | undefined> => {
  try {
    const params = { ...queries };
    if (isRandom) {
      params.random = 'true';
    }

    return (await axios.get<DogarsPage>('https://dogars.org/api/search', {
      responseType: 'json',
      params,
      headers: { 'Accept-Encoding': '*' },
    })).data;
  } catch (error) {
    log(DOGARS_API_LOG_PREFIX, (error as Error)?.message, true);

    return undefined;
  }
};
