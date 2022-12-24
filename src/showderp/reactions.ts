import { UnsubscribeFunction } from 'emittery';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';
import { toId } from '../showdown/index.js';
import { DogarsChatClient } from '../dogars/index.js';

interface TurnData {
  critMons: Set<string>,
  faintedMons: Set<string>,
  movesUsed: Record<string, string[]>,
}

type Room = {
  currentTurn: number;
  turns: Record<number, TurnData>;
  numberGreetings: number;
};

type Rooms = Record<string, Room>;

const stealthRockSynonyms = [
  'Aggressive Aggregate', 'Astucious Asphalt',
  'Buried Boulders',
  'Concealed Cobblestone', 'Covert Corundum',
  'Deceiving Deposit', 'Disguised Debris',
  'Elusive Elements',
  'Furtive Flint',
  'Guileful Granite',
  'Hidden Hornfels',
  'Insidious Iridium', 'Inconceivable Iron',
  'Jarring Jade',
  'Keen Kryptonite',
  'Latent Lead', 'Lurking Limestone',
  'Merciless Minerals', 'Metaphorical Moth Balls',
  'Ninja Nuggets',
  'Obscure Ore',
  'Pernicious Pebbles',
  'Quirky Quartz',
  'Rusing Radium', 'Reclusive Rocks',
  'Sacrilegious Shards', 'Shrouded Sediment', 'Smogon Stones',
  'Terrorizing Tectinics', 'Tricky Terrain',
  'Usurping Uranium',
  'Veiled Variolite',
  'Wily Wiluite', 'Wicked Whetstone',
  'Xenophobic Xenophyllite',
  'Yucky Yolk',
  'Zetetic Zircon',
];

const greetings = [
  'hi',
  'hello',
  'hejsan',
  'hej',
  'ni hao',
  'anyong haseyo',
  'konnichiwa',
  'tjenare',
  'gday',
  'hola',
];

const randomSynonym = () => stealthRockSynonyms[
  Math.floor(Math.random() * stealthRockSynonyms.length)
];

export const createReactor = (
  username: string,
  client: ManagedShowdownClient,
  dogars: DogarsChatClient,
) => {
  const ownId = toId(username);
  const { eventEmitter: showdownEventEmitter } = client;
  const { eventEmitter: dogarsEventEmitter } = dogars;
  const rooms: Rooms = {};
  const unsubscribeFunctions: UnsubscribeFunction[] = [];

  const react = (room: string, turn: TurnData) => {
    const messages: string[] = [];

    turn.faintedMons.forEach((faintedMon) => {
      if (turn.critMons.has(faintedMon)) {
        messages.push('crit mattered');
      }
    });

    if (turn.movesUsed.stealthrock) {
      const stealthRockUsers = turn.movesUsed.stealthrock;
      if (stealthRockUsers.length > 1) {
        messages.push('smogon handshake 🤝');
      } else if (stealthRockUsers.length === 1) {
        const firstUser = stealthRockUsers[0];
        messages.push(`${firstUser} used **${randomSynonym()}**!`);
      }
    }

    if (messages.length) {
      const firstMessage = messages[0];

      dogars.send(`${room}|${firstMessage}`);
    }
  };

  unsubscribeFunctions.push(dogarsEventEmitter.on('message', ({ room, user, message }) => {
    const userId = toId(user);
    const messageId = toId(message);

    if (userId === ownId) return;

    const roomData = rooms[room];

    if (roomData && roomData.numberGreetings < 5) {
      if (/v\s+[^\s]/.test(message)) {
        const random = Math.random();
        if (random > 0.95) {
          dogars.send(`${room}|me`);
          roomData.numberGreetings += 1;
          return;
        } else if (random > 0.80) {
          dogars.send(`${room}|--mirror--`);
          roomData.numberGreetings += 1;
          return;
        }
      }

      const matchedGreeting = greetings.find((greeting) => messageId === (toId(greeting) + ownId));

      if (matchedGreeting) {
        dogars.send(`${room}|${matchedGreeting} ${user}!`);
        roomData.numberGreetings += 1;
      }
    }
  }));

  unsubscribeFunctions.push(showdownEventEmitter.on('turn', (turnEvent) => {
    const room = rooms[turnEvent.room];

    if (room) {
      const { turn } = turnEvent.event[0];
      room.currentTurn = turn;
      room.turns[turn] = {
        critMons: new Set(),
        faintedMons: new Set(),
        movesUsed: {},
      };
    }
  }));

  unsubscribeFunctions.push(showdownEventEmitter.on('upkeep', (upkeepEvent) => {
    const room = rooms[upkeepEvent.room];

    if (room) {
      const endedTurn = room.turns[room.currentTurn];

      if (endedTurn) {
        react(upkeepEvent.room, endedTurn);
      }
    }
  }));

  unsubscribeFunctions.push(showdownEventEmitter.on('crit', (critEvent) => {
    const room = rooms[critEvent.room];

    if (room) {
      const currentTurn = room.turns[room.currentTurn];

      if (currentTurn) {
        const { player, subPosition } = critEvent.event[0].pokemon.position;
        const fullPosition = player + (subPosition || '');
        currentTurn.critMons.add(fullPosition);
      }
    }
  }));

  unsubscribeFunctions.push(showdownEventEmitter.on('faint', (faintEvent) => {
    const room = rooms[faintEvent.room];

    if (room) {
      const currentTurn = room.turns[room.currentTurn];

      if (currentTurn) {
        const { player, subPosition } = faintEvent.event[0].pokemon.position;
        const fullPosition = player + (subPosition || '');
        currentTurn.faintedMons.add(fullPosition);
      }
    }
  }));

  unsubscribeFunctions.push(showdownEventEmitter.on('move', (moveEvent) => {
    const room = rooms[moveEvent.room];

    if (room) {
      const currentTurn = room.turns[room.currentTurn];

      if (currentTurn) {
        const { move, user } = moveEvent.event[0];
        const moveId = toId(move);

        const movesUsed = currentTurn.movesUsed[moveId];
        if (movesUsed) {
          currentTurn.movesUsed[moveId] = [...movesUsed, user.name];
        } else {
          currentTurn.movesUsed[moveId] = [user.name];
        }
      }
    }
  }));

  unsubscribeFunctions.push(showdownEventEmitter.on('initializeRoom', (initializeRoomEvent) => {
    rooms[initializeRoomEvent.room] = {
      currentTurn: 0,
      turns: { 0: { critMons: new Set(), faintedMons: new Set(), movesUsed: {} } },
      numberGreetings: 0,
    };
  }));

  unsubscribeFunctions.push(showdownEventEmitter.on('deinitializeRoom', (deinitializeRoomEvent) => {
    const room = rooms[deinitializeRoomEvent.room];

    if (room) {
      delete rooms[deinitializeRoomEvent.room];
    }
  }));

  return {
    unsubscribe: () => {
      unsubscribeFunctions.forEach((unsubscribeFunction) => unsubscribeFunction());
    },
  };
};
