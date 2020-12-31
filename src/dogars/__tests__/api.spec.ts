import axios from 'axios';
import {
  advancedSearchSets,
  getRandomSetId,
  getSet,
  searchSets,
} from '..';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('advancedSearchSets', () => {
  it('Successfully retrieves a page of sets', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [1, { testKey: 'testValue' }] });

    const advancedSearchPage = await advancedSearchSets({ creator: 'me' });

    expect(advancedSearchPage).toBeDefined();
    expect(advancedSearchPage?.[0]).toEqual(1);
    expect(advancedSearchPage?.[1]).toEqual({ testKey: 'testValue' });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://dogars.ga/api/search',
      { params: { creator: 'me' } },
    );
  });

  it('Returns undefined when an error occurs', async () => {
    mockedAxios.get.mockRejectedValueOnce('error');

    const advancedSearchPage = await advancedSearchSets({ creator: 'me' });

    expect(advancedSearchPage).toBeUndefined();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://dogars.ga/api/search',
      { params: { creator: 'me' } },
    );
  });
});

describe('getSet', () => {
  it('Successfully retrieves a set', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { testKey: 'testValue' } });

    const set = await getSet(1);

    expect(set).toBeDefined();
    expect(set).toEqual({ testKey: 'testValue' });
    expect(mockedAxios.get).toHaveBeenCalledWith('https://dogars.ga/api/sets/1');
  });

  it('Returns undefined when an error occurs', async () => {
    mockedAxios.get.mockRejectedValueOnce('error');

    const set = await getSet(1);

    expect(set).toBeUndefined();
    expect(mockedAxios.get).toHaveBeenCalledWith('https://dogars.ga/api/sets/1');
  });
});

describe('getRandomSetId', () => {
  it('Successfully retrieves a random set id', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: 1 });

    const setId = await getRandomSetId();

    expect(setId).toBeDefined();
    expect(setId).toEqual(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('https://dogars.ga/api/random');
  });

  it('Returns undefined when an error occurs', async () => {
    mockedAxios.get.mockRejectedValueOnce('error');

    const setId = await getRandomSetId();

    expect(setId).toBeUndefined();
    expect(mockedAxios.get).toHaveBeenCalledWith('https://dogars.ga/api/random');
  });
});

describe('searchSets', () => {
  it('Successfully retrieves a page of sets', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [1, { testKey: 'testValue' }] });

    const searchPage = await searchSets('test');

    expect(searchPage).toBeDefined();
    expect(searchPage?.[0]).toEqual(1);
    expect(searchPage?.[1]).toEqual({ testKey: 'testValue' });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://dogars.ga/api/search',
      { params: { q: 'test', page: 1 } },
    );
  });

  it('Returns undefined when an error occurs', async () => {
    mockedAxios.get.mockRejectedValueOnce('error');

    const searchPage = await searchSets('test');

    expect(searchPage).toBeUndefined();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://dogars.ga/api/search',
      { params: { q: 'test', page: 1 } },
    );
  });
});
