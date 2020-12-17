import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import { ChallengeType, VerificationClient } from '../verification';

const toId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');

interface ShowdownVerifierConfiguration {
  username: string;
  password: string;
  avatar?: string;
}

// eslint-disable-next-line import/prefer-default-export
export const createShowdownVerifier = (
  verificationClient: VerificationClient,
) => {
  const showdownClient = new PrettyClient({});

  showdownClient.eventEmitter.on('pm', async (pmEvent) => {
    const pm = pmEvent.event[0];
    if (pm.message.startsWith('#verify')) {
      const secret = pm.message.substr(7).trim();

      const user = await verificationClient.verifyChallengeAndUpdateUser(
        secret,
        ChallengeType.SHOWDOWN,
        {
          showdownId: toId(pm.sender.username),
          showdownDisplayName: pm.sender.username,
        },
      );

      if (user) {
        await showdownClient.send(`|/pm ${pm.sender.username}, Successfully verified`);
      } else {
        await showdownClient.send(`|/pm ${pm.sender.username}, Invalid challenge, please check your message or try again`);
      }
    }
  });

  return showdownClient;
};
