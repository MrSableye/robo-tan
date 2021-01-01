import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import { VerificationClient } from '../verification';
import { toId } from './utility';

export const createVerificationMonitor = (
  client: PrettyClient,
  verificationClient: VerificationClient,
) => {
  const { eventEmitter } = client;

  const unsubscribe = eventEmitter.on('pm', async (pmEvent) => {
    const pm = pmEvent.event[0];
    if (pm.message.startsWith('#verify')) {
      const secret = pm.message.substr(7).trim();
      const newShowdownId = toId(pm.sender.username);

      const user = await verificationClient.verifyChallengeAndUpdateUser(
        secret,
        (userToUpdate) => {
          if (userToUpdate.showdownIds) {
            if (!userToUpdate.showdownIds.some((showdownId) => showdownId === newShowdownId)) {
              return {
                ...userToUpdate,
                showdownIds: [
                  newShowdownId,
                  ...userToUpdate.showdownIds,
                ].slice(0, 5), // TODO: Make this configurable
              };
            }
          } else {
            return {
              ...userToUpdate,
              showdownIds: [newShowdownId],
            };
          }

          return userToUpdate;
        },
      );

      if (user) {
        await client.send(`|/pm ${pm.sender.username}, Successfully verified`);
      } else {
        await client.send(`|/pm ${pm.sender.username}, Invalid challenge, please check your message or try again`);
      }
    }
  });

  return {
    unsubscribe,
  };
};
