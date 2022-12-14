import Emittery from 'emittery';
import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import { BattlePostEvent } from '../discord/notifier';
import { toId } from './utility';

type MatchResult = 'win' | 'tie' | 'loss';

type BasePlayer = { name: string, avatar?: string; };
type Player = (BasePlayer & { isChamp: false }) | (BasePlayer & { isChamp: true; player: string; result: MatchResult });

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
      teams: {},
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
        player: playerEvent.event[0].player,
        name: playerEvent.event[0].user.username,
        avatar: playerEvent.event[0].avatar,
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
        name: username,
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
        player: 'p1',
        name: username,
        ...room.participants[showdownId],
        isChamp: true,
        result: 'win',
      };

      client.send(`${winEvent.room}|/savereplay`);
      setTimeout(() => client.send(`${winEvent.room}|/leave`), 20 * 60 * 1000);
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

      client.send(`${tieEvent.room}|/savereplay`);
      setTimeout(() => client.send(`${tieEvent.room}|/leave`), 20 * 60 * 1000);
    }
  }));

  unsubscribeFunctions.push(eventEmitter.on('teamPreview', (teamPreviewEvent) => {
    const room = rooms[teamPreviewEvent.room];
    if (room) {
      const player = teamPreviewEvent.event[0].player;
      const species = teamPreviewEvent.event[0].pokemonDetails.species;

      room.teams[player] = [
        ...room.teams[player] || [],
        toId(species),
      ];
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
