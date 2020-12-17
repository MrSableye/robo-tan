import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import Emittery from 'emittery';
import { BattlePostEvent } from '../discord/notifier';
import { toId } from './utility';

// eslint-disable-next-line import/prefer-default-export
export const createBattleMonitor = (client: PrettyClient) => {
  const { eventEmitter } = client;
  const rooms: Record<string, Set<string>> = {};
  const unsubscribeFunctions: Emittery.UnsubscribeFn[] = [];

  unsubscribeFunctions.push(eventEmitter.on('initializeRoom', (initializeRoomEvent) => {
    rooms[initializeRoomEvent.room] = new Set();
  }));

  unsubscribeFunctions.push(eventEmitter.on('deinitializeRoom', (deinitializeRoomEvent) => {
    delete rooms[deinitializeRoomEvent.room];
  }));

  unsubscribeFunctions.push(eventEmitter.on('join', (joinEvent) => {
    if (rooms[joinEvent.room]) {
      const { username } = joinEvent.event[0].user;

      rooms[joinEvent.room].add(toId(username));
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('win', (winEvent) => {
    if (rooms[winEvent.room]) {
      console.log(winEvent.room, rooms[winEvent.room]);

      client.send(`${winEvent.room}|/leave`);
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('tie', (tieEvent) => {
    if (rooms[tieEvent.room]) {
      console.log(tieEvent.room, rooms[tieEvent.room]);

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
  };
};
