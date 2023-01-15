import { UnsubscribeFunction } from 'emittery';
import { ManagedShowdownClient } from 'borygon';
import { toId } from '../showdown/index.js';
import { DogarsChatClient } from '../dogars/index.js';
import { log } from '../logger.js';

const REACTIONS_LOG_PREFIX = 'REACTIONS';

interface TurnData {
  critMons: Set<string>,
  faintedMons: Set<string>,
  movesUsed: Record<string, string[]>,
}

type Room = {
  connectedAt: Date;
  filterMessages: boolean;
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
  const { messages } = client;
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

  unsubscribeFunctions.push(dogarsEventEmitter.on('message', ({ room, timestamp, user, message }) => {
    const userId = toId(user);
    const messageId = toId(message);
    const messageDate = new Date(timestamp);

    if (userId === ownId) return;

    const roomData = rooms[room];

    if (roomData && !roomData.filterMessages && (roomData.numberGreetings < 5)) {
      if (roomData.connectedAt > messageDate) {
        log(REACTIONS_LOG_PREFIX, `[${room}] Previous message ignored: ${user}|${message}`);
        return;
      }

      if (/^v\s+[^\s]/.test(message)) {
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

  unsubscribeFunctions.push(messages.on('turn', (turnMessage) => {
    const room = rooms[turnMessage.room];

    if (room && !room.filterMessages) {
      const { turn } = turnMessage.message[0];
      room.currentTurn = turn;
      room.turns[turn] = {
        critMons: new Set(),
        faintedMons: new Set(),
        movesUsed: {},
      };
    }
  }));

  unsubscribeFunctions.push(messages.on('upkeep', (upkeepMessage) => {
    const room = rooms[upkeepMessage.room];

    if (room && !room.filterMessages) {
      const endedTurn = room.turns[room.currentTurn];

      if (endedTurn) {
        react(upkeepMessage.room, endedTurn);
      }
    }
  }));

  unsubscribeFunctions.push(messages.on('crit', (critMessage) => {
    const room = rooms[critMessage.room];

    if (room && !room.filterMessages) {
      const currentTurn = room.turns[room.currentTurn];

      if (currentTurn) {
        const { player, subPosition } = critMessage.message[0].pokemon.position;
        const fullPosition = player + (subPosition || '');
        currentTurn.critMons.add(fullPosition);
      }
    }
  }));

  unsubscribeFunctions.push(messages.on('faint', (faintMessage) => {
    const room = rooms[faintMessage.room];

    if (room && !room.filterMessages) {
      const currentTurn = room.turns[room.currentTurn];

      if (currentTurn) {
        const { player, subPosition } = faintMessage.message[0].pokemon.position;
        const fullPosition = player + (subPosition || '');
        currentTurn.faintedMons.add(fullPosition);
      }
    }
  }));

  unsubscribeFunctions.push(messages.on('move', (moveMessage) => {
    const room = rooms[moveMessage.room];

    if (room && !room.filterMessages) {
      const currentTurn = room.turns[room.currentTurn];

      if (currentTurn) {
        const { move, user } = moveMessage.message[0];
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

  unsubscribeFunctions.push(messages.on('timestamp', (timestampMessage) => {
    const room = rooms[timestampMessage.room];

    if (room && room.filterMessages) {
      const { timestamp } = timestampMessage.message[0];
      const timestampDate = new Date(timestamp * 1000);
      if (timestampDate > room.connectedAt) {
        log(REACTIONS_LOG_PREFIX, `Disabling filter in ${timestampMessage.rawMessage}`);
        room.filterMessages = false;
      }
    }
  }));

  unsubscribeFunctions.push(messages.on('initializeRoom', (initializeRoomMessage) => {
    rooms[initializeRoomMessage.room] = {
      connectedAt: new Date(),
      filterMessages: true,
      currentTurn: 0,
      turns: { 0: { critMons: new Set(), faintedMons: new Set(), movesUsed: {} } },
      numberGreetings: 0,
    };
  }));

  unsubscribeFunctions.push(messages.on('deinitializeRoom', (deinitializeRoomMessage) => {
    const room = rooms[deinitializeRoomMessage.room];

    if (room) {
      delete rooms[deinitializeRoomMessage.room];
    }
  }));

  return {
    unsubscribe: () => {
      unsubscribeFunctions.forEach((unsubscribeFunction) => unsubscribeFunction());
    },
  };
};
