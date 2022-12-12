import Emittery from 'emittery';
import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import { BattlePostEvent } from '../discord/notifier';
import { toId } from './utility';

type MatchResult = 'win' | 'tie' | 'loss';

type Player = { isChamp: false } | { isChamp: true, result: MatchResult };

interface Room {
  name: string;
  start: number;
  participants: {
    [showdownId: string]: Player;
  };
}

interface Rooms {
  [roomName: string]: Room;
}

type BattleLifecycleEvents = {
  start: { roomName: string },
  end: { roomName: string, room: Room },
};

export const createBattleMonitor = (client: PrettyClient) => {
  const { eventEmitter } = client;
  const rooms: Rooms = {};
  const unsubscribeFunctions: Emittery.UnsubscribeFn[] = [];
  const battleEventEmitter = new Emittery.Typed<BattleLifecycleEvents>();

  unsubscribeFunctions.push(eventEmitter.on('initializeRoom', (initializeRoomEvent) => {
    rooms[initializeRoomEvent.room] = {
      name: initializeRoomEvent.room,
      start: new Date().getTime(),
      participants: {},
    };
    battleEventEmitter.emit('start', { roomName: initializeRoomEvent.room });
  }));

  unsubscribeFunctions.push(eventEmitter.on('deinitializeRoom', (deinitializeRoomEvent) => {
    const room = rooms[deinitializeRoomEvent.room];

    if (room) {
      battleEventEmitter.emit('end', {
        roomName: deinitializeRoomEvent.room,
        room,
      });

      setTimeout(() => delete rooms[deinitializeRoomEvent.room], 10000);
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('player', (playerEvent) => {
    const room = rooms[playerEvent.room];
    if (room) {
      const { username } = playerEvent.event[0].user;
      const showdownId = toId(username);

      room.participants[showdownId] = {
        result: 'loss',
        ...room.participants[showdownId],
        isChamp: true,
      };
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('join', (joinEvent) => {
    const room = rooms[joinEvent.room];
    if (room) {
      const { username } = joinEvent.event[0].user;
      const showdownId = toId(username);

      room.participants[showdownId] = {
        isChamp: false,
        ...room.participants[showdownId],
      };
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('win', (winEvent) => {
    const room = rooms[winEvent.room];
    if (room) {
      const { username } = winEvent.event[0].user;
      const showdownId = toId(username);

      room.participants[showdownId] = {
        ...room.participants[showdownId],
        isChamp: true,
        result: 'win',
      };

      client.send(`${winEvent.room}|/leave`);
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('tie', (tieEvent) => {
    const room = rooms[tieEvent.room];
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

      client.send(`${tieEvent.room}|/leave`);
    }
  }));

  const battlePostHandler = async (battlePostEvent: BattlePostEvent) => {
    let retries = 10; // TODO: Allow configuration
    const retryDelay = 30 * 1000; // TODO: Allow configuration
    const timeout = retries * 2 * retryDelay; // TODO: Allow configuration
    const [,, battleRoom] = battlePostEvent;

    await new Promise<void>((resolve, reject) => {
      const promiseUnsubscribeFunctions: Emittery.UnsubscribeFn[] = [];

      promiseUnsubscribeFunctions.push(eventEmitter.on('initializeRoom', (initializeRoomEvent) => {
        if (initializeRoomEvent.room === battleRoom) {
          promiseUnsubscribeFunctions.forEach(
            (promiseUnsubscribeFunction) => promiseUnsubscribeFunction(),
          );
          resolve();
        }
      }));

      promiseUnsubscribeFunctions.push(eventEmitter.on('errorInitializingRoom', (errorInitializingRoomEvent) => {
        if (errorInitializingRoomEvent.room === battleRoom) {
          const { errorType } = errorInitializingRoomEvent.event[0];

          if (errorType === 'joinfailed' && retries > 0) {
            retries -= 1;
            setTimeout(() => client.send(`|/join ${battleRoom}`), retryDelay);
          } else {
            reject();
          }
        }
      }));

      client.send(`|/join ${battleRoom}`);

      setTimeout(() => reject(), timeout);
    });
  };

  return {
    unsubscribe: () => {
      unsubscribeFunctions.forEach((unsubscribeFunction) => unsubscribeFunction());
    },
    battlePostHandler,
    battleEventEmitter,
  };
};
