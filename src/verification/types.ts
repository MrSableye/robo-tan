import { User } from '../store/user';
import {
  Challenge,
  ChallengeType,
} from '../store/challenge';

export interface VerificationClient {
  createChallenge(discordId: string, challengeType: ChallengeType): Promise<Challenge>;
  verifyChallengeAndUpdateUser(
    secret: string,
    type: ChallengeType,
    successfulUserModifier: (user: User) => User,
  ): Promise<User | undefined>;
}
