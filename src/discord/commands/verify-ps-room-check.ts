import { Message } from 'discord.js';
import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import { VerificationClient } from '../../verification';
import { toId } from '../../showdown';

export const createVerifyPsRoomCheckCommand = (
  showdownRoomVerificationClient: VerificationClient<string[]>,
  showdownClient: PrettyClient,
) => {
  const commandHandler = async (message: Message, commandText: string) => {
    const newShowdownId = toId(commandText);

    const [userRooms] = await Promise.all([
      showdownClient.receive(
        'queryResponse',
        60 * 1000,
        (queryResponseEvent) => {
          const { responseType, response } = queryResponseEvent.event[0];
          const { id, rooms } = JSON.parse(response);

          return rooms && responseType === 'userdetails' && id === newShowdownId;
        },
      ).then((queryResponseEvent) => {
        const { rooms } = JSON.parse(queryResponseEvent.event[0].response);

        return Object.keys(rooms).map(toId);
      }),
      showdownClient.send(`|/cmd userdetails ${newShowdownId}`),
    ]);

    const user = await showdownRoomVerificationClient.verifyChallengeAndUpdateUser(
      userRooms,
      (userToUpdate) => {
        if (userToUpdate.showdownIds) {
          if (!userToUpdate.showdownIds.some((showdownId) => showdownId === newShowdownId)) {
            return {
              ...userToUpdate,
              showdownIds: [
                newShowdownId,
                ...userToUpdate.showdownIds,
              ].slice(0, 20), // TODO: Make this configurable
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
      return message.author.send(`Successfully verified ${newShowdownId}`);
    }
    return message.author.send(`Failed to verify ${newShowdownId}`);
  };

  return {
    commands: ['verifyps-room-check'],
    handler: commandHandler,
    help: [
      {
        name: '!verifyps-room-check <showdownId>',
        value: 'Checks the rooms the user <showdownId> is within as a follow up to !verifyps-room',
        inline: false,
      },
    ],
  };
};
