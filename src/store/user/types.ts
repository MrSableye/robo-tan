export interface User {
  discordId: string;
  showdownIds?: string[];
  tripcode?: string;
}

export interface UserStore {
  upsertUser(user: User): Promise<User>;
  getUser(discordId: string): Promise<User | undefined>;
  deleteShowdownId(discordId: string): Promise<User | undefined>;
  deleteTripcode(discordId: string): Promise<User | undefined>;
  deleteUser(discordId: string): Promise<boolean>;
  getUsersByShowdownId(showdownId: string): Promise<User[]>;
  getUsersByTripcode(tripcode: string): Promise<User[]>;
}
