export enum ChallengeType {
  SHOWDOWN = 'SHOWDOWN',
  SHOWDOWN_ROOM = 'SHOWDOWN_ROOM',
  YOTSUBA = 'YOTSUBA',
}

export interface Challenge<S = string> {
  secret: S;
  type: ChallengeType;
  discordId: string;
  expiryTime: number;
}

export interface ChallengeStore<S = string> {
  upsertChallenge(challenge: Challenge<S>): Promise<Challenge<S>>;
  getChallenge(secret: S, type: ChallengeType): Promise<Challenge<S> | undefined>;
  deleteChallenge(secret: S, type: ChallengeType): Promise<boolean>;
}
