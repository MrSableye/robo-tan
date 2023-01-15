import Emittery, { UnsubscribeFunction } from 'emittery';
import { ManagedShowdownClient } from 'borygon';
import { BattlePostEvent } from '../discord/notifier.js';
import { toId } from './utility.js';

type MatchResult = 'win' | 'tie' | 'loss';

type BasePlayer = { name: string, avatar?: string; };
type NonChampPlayer = (BasePlayer & { isChamp: false });
type ChampPlayer = (BasePlayer & { isChamp: true; player: string; result: MatchResult });
type Player = NonChampPlayer | ChampPlayer;

interface Room {
  name: string;
  start: number;
  participants: {
    [showdownId: string]: Player;
  };
  teams: {
    [player: string]: string[];
  };
}

interface Rooms {
  [roomName: string]: Room;
}

type BattleLifecycleEvents = {
  start: { roomName: string },
  end: { roomName: string, room: Room },
};

export const createBattleMonitor = (client: ManagedShowdownClient) => {
  const { messages } = client;
  const rooms: Rooms = {};
  const unsubscribeFunctions: UnsubscribeFunction[] = [];
  const battleEventEmitter = new Emittery<BattleLifecycleEvents>();

  unsubscribeFunctions.push(messages.on('initializeRoom', (initializeRoomMessage) => {
    rooms[initializeRoomMessage.room] = {
      name: initializeRoomMessage.room,
      start: new Date().getTime(),
      participants: {},
      teams: {},
    };
    battleEventEmitter.emit('start', { roomName: initializeRoomMessage.room });
  }));

  unsubscribeFunctions.push(messages.on('deinitializeRoom', (deinitializeRoomMessage) => {
    const room = rooms[deinitializeRoomMessage.room];

    if (room) {
      battleEventEmitter.emit('end', {
        roomName: deinitializeRoomMessage.room,
        room,
      });

      setTimeout(() => delete rooms[deinitializeRoomMessage.room], 10000);
    }
  }));

  unsubscribeFunctions.push(messages.on('player', (playerMessage) => {
    const room = rooms[playerMessage.room];
    if (room) {
      const { user } = playerMessage.message[0];
      if (user) {
        const showdownId = toId(user.username);

        room.participants[showdownId] = {
          result: 'loss',
          ...room.participants[showdownId],
          isChamp: true,
          player: playerMessage.message[0].player,
          name: user.username,
          avatar: playerMessage.message[0].avatar,
        };
      }
    }
  }));

  unsubscribeFunctions.push(messages.on('join', (joinMessage) => {
    const room = rooms[joinMessage.room];
    if (room) {
      const { username } = joinMessage.message[0].user;
      const showdownId = toId(username);

      room.participants[showdownId] = {
        isChamp: false,
        name: username,
        ...room.participants[showdownId],
      };
    }
  }));

  unsubscribeFunctions.push(messages.on('win', (winMessage) => {
    const room = rooms[winMessage.room];
    if (room) {
      const { username } = winMessage.message[0].user;
      const showdownId = toId(username);

      room.participants[showdownId] = {
        player: 'p1',
        name: username,
        ...room.participants[showdownId],
        isChamp: true,
        result: 'win',
      };

      client.send(`${winMessage.room}|/savereplay`);
      setTimeout(() => client.send(`${winMessage.room}|/leave`), 20 * 60 * 1000);
    }
  }));

  unsubscribeFunctions.push(messages.on('tie', (tieMessage) => {
    const room = rooms[tieMessage.room];
    if (room) {
      Object.entries(room.participants).forEach(([playerId, player]) => {
        if (player.isChamp) {
          room.participants[playerId] = {
            ...player,
            isChamp: true,
            result: 'tie',
          };
        }
      });

      client.send(`${tieMessage.room}|/savereplay`);
      setTimeout(() => client.send(`${tieMessage.room}|/leave`), 20 * 60 * 1000);
    }
  }));

  unsubscribeFunctions.push(messages.on('teamPreview', (teamPreviewMessage) => {
    const room = rooms[teamPreviewMessage.room];
    if (room) {
      const { player } = teamPreviewMessage.message[0];
      const { species } = teamPreviewMessage.message[0].pokemonDetails;

      room.teams[player] = [
        ...room.teams[player] || [],
        toId(species),
      ];
    }
  }));

  const handleBattlePost = async (battlePostEvent: BattlePostEvent) => {
    let retries = 10; // TODO: Allow configuration
    const retryDelay = 30 * 1000; // TODO: Allow configuration
    const timeout = retries * 2 * retryDelay; // TODO: Allow configuration
    const [,, battleRoom] = battlePostEvent;

    await new Promise<void>((resolve, reject) => {
      const promiseUnsubscribeFunctions: UnsubscribeFunction[] = [
        messages.on('initializeRoom', (initializeRoomMessage) => {
          if (initializeRoomMessage.room === battleRoom) {
            promiseUnsubscribeFunctions.forEach(
              (promiseUnsubscribeFunction) => promiseUnsubscribeFunction(),
            );
            resolve();
          }
        }),
        messages.on('errorInitializingRoom', (errorInitializingRoomMessage) => {
          if (errorInitializingRoomMessage.room === battleRoom) {
            const { errorType } = errorInitializingRoomMessage.message[0];

            if (errorType === 'joinfailed' && retries > 0) {
              retries -= 1;
              setTimeout(() => client.send(`|/join ${battleRoom}`), retryDelay);
            } else {
              reject();
            }
          }
        }),
      ];

      client.send(`|/join ${battleRoom}`);

      setTimeout(() => reject(), timeout);
    });
  };

  return {
    unsubscribe: () => {
      unsubscribeFunctions.forEach((unsubscribeFunction) => unsubscribeFunction());
    },
    handleBattlePost,
    battleEventEmitter,
  };
};
