export interface Battle {
  showdownId: string;
  battleRoom: string;
  isChamp: boolean;
  battleStartTime: number;
  result?: 'win' | 'tie' | 'loss';
}

export interface BattleStore {
  upsertBattle(battle: Battle): Promise<Battle>;
  getBattle(showdownId: string, battleRoom: string): Promise<Battle | undefined>;
  deleteBattle(showdownId: string, battleRoom: string): Promise<boolean>;
}
