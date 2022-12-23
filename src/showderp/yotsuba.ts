import axios from 'axios';
import { CatalogPage, Thread } from '../types.js';

export const getCatalog = async (board: string) => {
  console.time(`Retrieved /${board}/ catalog`);
  const response = await axios.get<CatalogPage[]>(`https://a.4cdn.org/${board}/catalog.json`, {
    responseType: 'json',
    headers: { 'Accept-Encoding': '*' },
  });
  console.timeEnd(`Retrieved /${board}/ catalog`);

  return response.data.flatMap((page) => page.threads);
};

export const getThread = async (board: string, postNumber: number) => {
  console.time(`Retrieved /${board}/${postNumber}`);
  const response = await axios.get<Thread>(`https://a.4cdn.org/${board}/thread/${postNumber}.json`, {
    responseType: 'json',
    headers: { 'Accept-Encoding': '*' },
  });
  console.timeEnd(`Retrieved /${board}/${postNumber}`);

  return response.data.posts;
};
