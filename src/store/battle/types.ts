export interface Battle {
  showdownId: string;
  showdownUsername?: string;
  battleRoom: string;
  isChamp: boolean;
  battleStartTime: number;
  result?: 'win' | 'tie' | 'loss';
  team?: string[];
  avatar?: string;
}

export interface BattleStore {
  upsertBattle(battle: Battle): Promise<Battle>;
  getBattle(showdownId: string, battleRoom: string): Promise<Battle | undefined>;
  deleteBattle(showdownId: string, battleRoom: string): Promise<boolean>;
}
