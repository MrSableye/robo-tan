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

export class UserChallengeVerificationClient implements VerificationClient {
  challengeStore: ChallengeStore;

  userStore: UserStore;

  constructor(
    challengeStore: ChallengeStore,
    userStore: UserStore,
  ) {
    this.challengeStore = challengeStore;
    this.userStore = userStore;
  }

  async createChallenge(discordId: string, type: ChallengeType): Promise<Challenge> {
    const challenge = generateChallenge(discordId, type);

    return this.challengeStore.upsertChallenge(challenge);
  }

  async verifyChallengeAndUpdateUser(
    secret: string,
    type: ChallengeType,
    successfulUserModifier: (user: User) => User,
  ): Promise<User | undefined> {
    const challenge = await this.challengeStore.getChallenge(secret, type);

    if (challenge) {
      let user: User | undefined = await this.userStore.getUser(challenge.discordId);

      if (!user) {
        user = {
          discordId: challenge.discordId,
        };
      }

      user = successfulUserModifier(user);

      user = await this.userStore.upsertUser(user);

      await this.challengeStore.deleteChallenge(secret, type);

      return user;
    }

    return undefined;
  }
}
