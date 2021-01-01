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

const generateChallenge = (
  discordId: string,
  stringList: string[],
  size: number,
): Challenge<string[]> => {
  const secretSet = new Set<string>();

  if (stringList.length < size) {
    stringList.forEach((string) => secretSet.add(string));
  } else {
    while (secretSet.size < size) {
      const randomString = stringList[Math.floor(Math.random() * stringList.length)];

      if (randomString) {
        secretSet.add(randomString);
      }
    }
  }

  const secretList = [...secretSet.values()].sort();

  return {
    secret: secretList,
    type: ChallengeType.YOTSUBA,
    discordId,
    expiryTime: Math.floor((new Date().getTime() + 5 * 60 * 1000) / 1000),
  };
};

export class StringListVerificationClient implements VerificationClient<string[]> {
  type: ChallengeType;

  challengeStore: ChallengeStore;

  userStore: UserStore;

  stringList: string[];

  secretListSize: number;

  constructor(
    type: ChallengeType,
    challengeStore: ChallengeStore,
    userStore: UserStore,
    stringList: string[],
    secretListSize: number,
  ) {
    this.type = type;
    this.challengeStore = challengeStore;
    this.userStore = userStore;
    this.stringList = stringList;
    this.secretListSize = secretListSize;
  }

  async createChallenge(discordId: string): Promise<Challenge<string[]>> {
    const challenge = generateChallenge(
      discordId,
      this.stringList,
      this.secretListSize,
    );

    const rawChallenge = {
      ...challenge,
      secret: challenge.secret.join('|'),
    };

    await this.challengeStore.upsertChallenge(rawChallenge);

    return challenge;
  }

  async verifyChallengeAndUpdateUser(
    secret: string[],
    successfulUserModifier: (user: User) => User,
  ): Promise<User | undefined> {
    const sortedSecret = [...secret].sort();

    const rawChallenge = await this.challengeStore.getChallenge(
      sortedSecret.join('|'),
      this.type,
    );

    if (rawChallenge) {
      let user: User | undefined = await this.userStore.getUser(rawChallenge.discordId);

      if (!user) {
        user = {
          discordId: rawChallenge.discordId,
        };
      }

      user = successfulUserModifier(user);

      user = await this.userStore.upsertUser(user);

      await this.challengeStore.deleteChallenge(rawChallenge.secret, this.type);

      return user;
    }

    return undefined;
  }
}
