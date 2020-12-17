import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import { ChallengeType, VerificationClient } from '../verification';

const toId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');

// eslint-disable-next-line import/prefer-default-export
export const createShowdownClient = (
  verificationClient: VerificationClient,
) => {
  const showdownClient = new PrettyClient({});
  const rooms: Record<string, Set<string>> = {};

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

  showdownClient.eventEmitter.on('initializeRoom', (initializeRoomEvent) => {
    rooms[initializeRoomEvent.room] = new Set();
  });

  showdownClient.eventEmitter.on('deinitializeRoom', (deinitializeRoomEvent) => {
    delete rooms[deinitializeRoomEvent.room];
  });

  showdownClient.eventEmitter.on('join', (joinEvent) => {
    if (rooms[joinEvent.room]) {
      const { username } = joinEvent.event[0].user;

      rooms[joinEvent.room].add(toId(username));
    }
  });

  showdownClient.eventEmitter.on('win', (winEvent) => {
    if (rooms[winEvent.room]) {
      console.log(winEvent.room, rooms[winEvent.room]);

      showdownClient.send(`${winEvent.room}|/leave`);
    }
  });

  showdownClient.eventEmitter.on('tie', (tieEvent) => {
    if (rooms[tieEvent.room]) {
      console.log(tieEvent.room, rooms[tieEvent.room]);

      showdownClient.send(`${tieEvent.room}|/leave`);
    }
  });

  return showdownClient;
};
