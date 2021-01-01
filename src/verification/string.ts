import {
  User,
  UserStore,
} from '../store/user';
import {
  Challenge,
  ChallengeStore,
  ChallengeType,
} from '../store/challenge';
import { VerificationClient } from './types';

const generateChallenge = (discordId: string, type: ChallengeType) => ({
  secret: Math.random().toString(36).substring(2, 15),
  type,
  discordId,
  expiryTime: Math.floor((new Date().getTime() + 5 * 60 * 1000) / 1000),
});

export class StringVerificationClient implements VerificationClient {
  type: ChallengeType;

  challengeStore: ChallengeStore;

  userStore: UserStore;

  constructor(
    type: ChallengeType,
    challengeStore: ChallengeStore,
    userStore: UserStore,
  ) {
    this.type = type;
    this.challengeStore = challengeStore;
    this.userStore = userStore;
  }

  async createChallenge(discordId: string): Promise<Challenge> {
    const challenge = generateChallenge(discordId, this.type);

    return this.challengeStore.upsertChallenge(challenge);
  }

  async verifyChallengeAndUpdateUser(
    secret: string,
    successfulUserModifier: (user: User) => User,
  ): Promise<User | undefined> {
    const challenge = await this.challengeStore.getChallenge(secret, this.type);

    if (challenge) {
      let user: User | undefined = await this.userStore.getUser(challenge.discordId);

      if (!user) {
        user = {
          discordId: challenge.discordId,
        };
      }

      user = successfulUserModifier(user);

      user = await this.userStore.upsertUser(user);

      await this.challengeStore.deleteChallenge(secret, this.type);

      return user;
    }

    return undefined;
  }
}
