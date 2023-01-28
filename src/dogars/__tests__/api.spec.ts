import axios from 'axios';
import {
  advancedSearchSets,
  getRandomSetId,
  getSet,
  searchSets,
} from '../api.js';
import { log } from '../../logger.js';

jest.mock('axios');
jest.mock('../../logger.js');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedLog = log as jest.Mocked<typeof log>;

describe('advancedSearchSets', () => {
  it('Successfully retrieves a page of sets', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [1, { testKey: 'testValue' }] });

    const advancedSearchPage = await advancedSearchSets({ creator: 'me' });

    expect(advancedSearchPage).toBeDefined();
    expect(advancedSearchPage?.[0]).toEqual(1);
    expect(advancedSearchPage?.[1]).toEqual({ testKey: 'testValue' });
    expect(mockedLog).not.toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://showderp.fun/api/search',
      {
        params: { creator: 'me' },
        headers: { 'Accept-Encoding': '*' },
        responseType: 'json',
      },
    );
  });

  it('Returns undefined when an error occurs', async () => {
    mockedAxios.get.mockRejectedValueOnce('error');

    const advancedSearchPage = await advancedSearchSets({ creator: 'me' });

    expect(advancedSearchPage).toBeUndefined();
    expect(mockedLog).toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://showderp.fun/api/search',
      {
        params: { creator: 'me' },
        headers: { 'Accept-Encoding': '*' },
        responseType: 'json',
      },
    );
  });
});

describe('getSet', () => {
  it('Successfully retrieves a set', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { testKey: 'testValue' } });

    const set = await getSet(1);

    expect(set).toBeDefined();
    expect(set).toEqual({ testKey: 'testValue' });
    expect(mockedLog).not.toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://showderp.fun/api/sets/1',
      {
        headers: { 'Accept-Encoding': '*' },
        responseType: 'json',
      },
    );
  });

  it('Returns undefined when an error occurs', async () => {
    mockedAxios.get.mockRejectedValueOnce('error');

    const set = await getSet(1);

    expect(set).toBeUndefined();
    expect(mockedLog).toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://showderp.fun/api/sets/1',
      {
        headers: { 'Accept-Encoding': '*' },
        responseType: 'json',
      },
    );
  });
});

describe('getRandomSetId', () => {
  it('Successfully retrieves a random set id', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: 1 });

    const setId = await getRandomSetId();

    expect(setId).toBeDefined();
    expect(setId).toEqual(1);
    expect(mockedLog).not.toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://showderp.fun/api/random',
      {
        headers: { 'Accept-Encoding': '*' },
        responseType: 'json',
      },
    );
  });

  it('Returns undefined when an error occurs', async () => {
    mockedAxios.get.mockRejectedValueOnce('error');

    const setId = await getRandomSetId();

    expect(setId).toBeUndefined();
    expect(mockedLog).toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://showderp.fun/api/random',
      {
        headers: { 'Accept-Encoding': '*' },
        responseType: 'json',
      },
    );
  });
});

describe('searchSets', () => {
  it('Successfully retrieves a page of sets', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [1, { testKey: 'testValue' }] });

    const searchPage = await searchSets('test');

    expect(searchPage).toBeDefined();
    expect(searchPage?.[0]).toEqual(1);
    expect(searchPage?.[1]).toEqual({ testKey: 'testValue' });
    expect(mockedLog).not.toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://showderp.fun/api/search',
      {
        params: { q: 'test', page: 1 },
        headers: { 'Accept-Encoding': '*' },
        responseType: 'json',
      },
    );
  });

  it('Returns undefined when an error occurs', async () => {
    mockedAxios.get.mockRejectedValueOnce('error');

    const searchPage = await searchSets('test');

    expect(searchPage).toBeUndefined();
    expect(mockedLog).toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://showderp.fun/api/search',
      {
        params: { q: 'test', page: 1 },
        headers: { 'Accept-Encoding': '*' },
        responseType: 'json',
      },
    );
  });
});
