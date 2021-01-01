import { User } from '../store/user';
import { Challenge } from '../store/challenge';

export interface VerificationClient<T = string> {
  createChallenge(discordId: string): Promise<Challenge<T>>;
  verifyChallengeAndUpdateUser(
    secret: T,
    successfulUserModifier: (user: User) => User,
  ): Promise<User | undefined>;
}
