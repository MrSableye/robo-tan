export enum ChallengeType {
  SHOWDOWN = 'SHOWDOWN',
  SHOWDOWN_ROOM = 'SHOWDOWN_ROOM',
  YOTSUBA = 'YOTSUBA',
}

export interface Challenge<T = string> {
  secret: T;
  type: ChallengeType;
  discordId: string;
  expiryTime: number;
}

export interface ChallengeStore {
  upsertChallenge(challenge: Challenge): Promise<Challenge>;
  getChallenge(secret: string, type: ChallengeType): Promise<Challenge | undefined>;
  deleteChallenge(secret: string, type: ChallengeType): Promise<boolean>;
}
