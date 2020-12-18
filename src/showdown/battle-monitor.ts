import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import Emittery from 'emittery';
import { BattlePostEvent } from '../discord/notifier';
import { toId } from './utility';

interface Player {
  isChamp: boolean;
}

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

// eslint-disable-next-line import/prefer-default-export
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
      delete rooms[deinitializeRoomEvent.room];
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('player', (playerEvent) => {
    const room = rooms[playerEvent.room];
    if (room) {
      const { username } = playerEvent.event[0].user;
      const showdownId = toId(username);

      room.participants[showdownId] = {
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
        ...room.participants[showdownId],
        isChamp: room.participants[showdownId]?.isChamp || false,
      };
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('win', (winEvent) => {
    if (rooms[winEvent.room]) {
      client.send(`${winEvent.room}|/leave`);
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('tie', (tieEvent) => {
    if (rooms[tieEvent.room]) {
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
