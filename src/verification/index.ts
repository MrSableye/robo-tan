import {
  Challenge,
  ChallengeType,
  ChallengeDatabaseClient,
  User,
  UserData,
  UserDatabaseClient,
} from './store';

export interface VerificationClient {
  createChallenge(discordId: string, challengeType: ChallengeType): Promise<Challenge>;
  verifyChallengeAndUpdateUser(
    secret: string,
    type: ChallengeType,
    userData: UserData,
  ): Promise<User | undefined>;
}

const generateChallenge = (discordId: string, type: ChallengeType) => ({
  secret: Math.random().toString(36).substring(2, 15),
  type,
  discordId,
  expiryTime: Math.floor((new Date().getTime() + 5 * 60 * 1000) / 1000),
});

export class DatabaseVerificationClient implements VerificationClient {
  challengeDatabaseClient: ChallengeDatabaseClient;

  userDatabaseClient: UserDatabaseClient;

  constructor(
    challengeDatabaseClient: ChallengeDatabaseClient,
    userDatabaseClient: UserDatabaseClient,
  ) {
    this.challengeDatabaseClient = challengeDatabaseClient;
    this.userDatabaseClient = userDatabaseClient;
  }

  async createChallenge(discordId: string, type: ChallengeType): Promise<Challenge> {
    const challenge = generateChallenge(discordId, type);

    return this.challengeDatabaseClient.upsertChallenge(challenge);
  }

  async verifyChallengeAndUpdateUser(
    secret: string,
    type: ChallengeType,
    userData: UserData,
  ): Promise<User | undefined> {
    const challenge = await this.challengeDatabaseClient.getChallenge(secret, type);

    if (challenge) {
      let user: User | undefined = await this.userDatabaseClient.getUser(challenge.discordId);

      if (!user) {
        user = {
          discordId: challenge.discordId,
        };
      }

      user = {
        ...user,
        ...userData,
      };

      user = await this.userDatabaseClient.upsertUser(user);

      await this.challengeDatabaseClient.deleteChallenge(secret, type);

      return user;
    }

    return undefined;
  }
}
