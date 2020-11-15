import axios from 'axios';

interface CatalogPage {
  threads: Post[];
}

interface Thread {
  posts: Post[];
}

export interface Post {
  no: number;
  name?: string;
  time: number;
  trip?: string;
  sub?: string;
  com?: string;
  tim?: number;
  ext?: string;
}

export const getCatalog = async (board: string) => {
  console.time(`Retrieved /${board}/ catalog`);
  const response = await axios.get<CatalogPage[]>(`https://a.4cdn.org/${board}/catalog.json`);
  console.timeEnd(`Retrieved /${board}/ catalog`);

  return response.data.flatMap((page) => page.threads);
};

export const getThread = async (board: string, postNumber: number) => {
  console.time(`Retrieved /${board}/${postNumber}`);
  const response = await axios.get<Thread>(`https://a.4cdn.org/${board}/thread/${postNumber}.json`);
  console.timeEnd(`Retrieved /${board}/${postNumber}`);

  return response.data.posts;
};
