import Axios from 'axios';

type DogarsPage = [number, [DogarsSet]];

export interface DogarsSet {
  id: number;
  description?: string;
  date_added: number;
  format: string;
  creator?: string;
  hash?: string;
  has_custom?: number;
  species: string;
  name?: string;
  gender?: string;
  item?: string;
  ability?: string;
  shiny?: number;
  level?: number;
  happiness?: number;
  nature?: string;
  move_1?: string;
  move_2?: string;
  move_3?: string;
  move_4?: string;
  hp_ev?: number;
  atk_ev?: number;
  def_ev?: number;
  spa_ev?: number;
  spd_ev?: number;
  spe_ev?: number;
  hp_iv?: number;
  atk_iv?: number;
  def_iv?: number;
  spa_iv?: number;
  spd_iv?: number;
  spe_iv?: number;
}

interface Stats {
  HP?: number;
  Atk?: number;
  Def?: number;
  SpA?: number;
  SpD?: number;
  Spe?: number;
}

const statsToString = (stats: Stats, filteredValue: number) => {
  const statsString = Object.entries(stats)
    .filter(([, statValue]) => statValue !== filteredValue)
    .map(([statName, statValue]) => `${statValue} ${statName}`)
    .join(' / ');

  return statsString === '' ? undefined : statsString;
};

const setToString = (set: DogarsSet) => {
  const lines = [];

  let firstLine = '';
  firstLine += set.name && set.name !== set.species
    ? `${set.name} (${set.species})`
    : `${set.species ?? ''}`;
  firstLine += set.gender ? ` (${set.gender})` : '';
  firstLine += set.item && set.item !== '' ? ` @ ${set.item}` : '';
  if (firstLine !== '') lines.push(firstLine);

  if (set.ability) lines.push(`Ability: ${set.ability}`);
  if (set.level && set.level !== 100) lines.push(`Level: ${set.level}`);
  if (set.shiny === 1) lines.push('Shiny: Yes');
  if (typeof set.happiness === 'number' && set.happiness < 255 && !Number.isNaN(set.happiness)) {
    lines.push(`Happiness: ${set.happiness}`);
  }
  if (set.nature) lines.push(`${set.nature} Nature`);

  const evs = {
    HP: set.hp_ev,
    Atk: set.atk_ev,
    Def: set.def_ev,
    SpA: set.spa_ev,
    SpD: set.spd_ev,
    Spe: set.spe_ev,
  };
  const evLine = statsToString(evs, 0);
  if (evLine) lines.push(`EVs: ${evLine}`);

  const ivs = {
    HP: set.hp_iv,
    Atk: set.atk_iv,
    Def: set.def_iv,
    SpA: set.spa_iv,
    SpD: set.spd_iv,
    Spe: set.spe_iv,
  }
  const ivLine = statsToString(ivs, 31);
  if (ivLine) lines.push(`IVs: ${ivLine}`);

  const moves = [set.move_1, set.move_2, set.move_3, set.move_4].filter(move => move);

  if (moves.length > 0) {
    lines.push(...moves.map((move) => `- ${move}`));
  }

  return lines.join('\n');
};

export const getSet = async (id: number): Promise<[DogarsSet, string] | undefined> => {
  try {
    const set = (await Axios.get<DogarsSet>(`https://dogars.ga/api/sets/${id}`)).data;
    const setText = setToString(set);

    return [set, setText];
  } catch (error) {
    return undefined;
  }
}

export const randomSet = async () => {
  const setId = (await Axios.get<number>('https://dogars.ga/api/random')).data;

  return getSet(setId);
}

export const searchSet = async (query: string): Promise<[DogarsSet, string] | undefined> => {
  try {
    const sets = (await Axios.get<DogarsPage>('https://dogars.ga/api/search', { params: { q: query, page: 1 } })).data[1];

    if (sets.length > 0) {
      const setText = setToString(sets[0]);

      return [sets[0], setText];
    }
  } catch (error) {
    return undefined;
  }
}