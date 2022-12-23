import Discord from 'discord.js';
import AWS from 'aws-sdk';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';
import {
  DynamoDBConfigurationStore,
  InMemoryConfigurationStore,
  OrderedFailThroughStore,
} from './store/configuration/index.js';
import { DynamoDBBattleStore } from './store/battle/index.js';
import { createBattleMonitor } from './showdown/index.js';
import { createReactor, createShowderpMonitor } from './showderp/index.js';
import { BotSettings } from './settings.js';
import { DogarsChatClient } from './dogars/index.js';
import { createBattlePostHandler, createThreadHandler } from './discord/index.js';
import { log, logExecution } from './logger.js';

const INITIALIZATION_LOG_PREFIX = 'INITIALIZATION';

export const createBot = async (settings: BotSettings) => {
  const dynamoDBClient = new AWS.DynamoDB.DocumentClient({});

  const battleStore = new DynamoDBBattleStore(
    dynamoDBClient,
    {
      battleTableName: settings.database.battleTable,
    },
  );

  const dynamoDBConfigurationStore = new DynamoDBConfigurationStore(
    dynamoDBClient,
    settings.database.configurationTable,
  );
  const configurationStore = new OrderedFailThroughStore([
    new InMemoryConfigurationStore(),
    dynamoDBConfigurationStore,
  ]);

  const discordClient = new Discord.Client({ intents: [] });

  const {
    timeout: showderpMonitorTimeout,
    showderpMonitor,
  } = await createShowderpMonitor(
    2 * 1000,
    configurationStore,
  );

  const showdownClient = new ManagedShowdownClient({
    debug: true,
    debugPrefix: '[SHOWDOWN CLIENT]',
  });

  const dogarsChatClient = new DogarsChatClient({});

  logExecution(
    INITIALIZATION_LOG_PREFIX,
    'Connecting to Dogars',
    'Connected to Dogars',
    async () => await dogarsChatClient.connect(),
  );

  const showdownUnsubscribeFunctions = [
    showdownClient.lifecycleEmitter.on('loginAssertion', (loginAssertion) => {
      dogarsChatClient.send(`|/trn ${settings.showdown.username},${settings.showdown.avatar || '0'},${loginAssertion}`);
    }),
    showdownClient.eventEmitter.on('initializeRoom', (initializeRoomEvent) => {
      log('DOGARS', `Joining Dogars chat for ${initializeRoomEvent.room}`);
      dogarsChatClient.send(`|/join ${initializeRoomEvent.room}`, 10);
    }),
    showdownClient.eventEmitter.on('deinitializeRoom', (deinitializeRoomEvent) => {
      log('DOGARS', `Joining Dogars chat for ${deinitializeRoomEvent.room}`);
      dogarsChatClient.send(`|/leave ${deinitializeRoomEvent.room}`, 10);
    }),
  ];

  const {
    battleEventEmitter,
    handleBattlePost,
    unsubscribe: unsubscribeBattleMonitor,
  } = createBattleMonitor(showdownClient);

  const {
    unsubscribe: unsubscribeReactor,
  } = createReactor(settings.showdown.username, showdownClient, dogarsChatClient);

  logExecution(
    INITIALIZATION_LOG_PREFIX,
    'Connecting to Showdown',
    'Connected to Showdown',
    async () => await showdownClient.connect(),
  );

  logExecution(
    INITIALIZATION_LOG_PREFIX,
    'Logging in to Showdown',
    'Logged in to Showdown',
    async () => await showdownClient.login(
      settings.showdown.username,
      settings.showdown.password,
      settings.showdown.avatar,
    ),
  );

  let previousRoom: string;

  battleEventEmitter.on('start', ({ roomName }) => {
    log('BATTLE', `Battle started: ${roomName}`);

    if (previousRoom) {
      dogarsChatClient.send(`${previousRoom}|https://play.dogars.org/${roomName}`);
    }

    previousRoom = roomName;
  });

  battleEventEmitter.on('end', async ({ roomName, room }) => {
    log('BATTLE', `Battle ended: ${roomName}`);

    setTimeout(async () => {
      try {
        await Promise.all(
          Object.entries(room.participants)
            .map(([showdownId, player]) => {
              const result = player.isChamp ? player.result : undefined;
              const team = player.isChamp ? room.teams[player.player] : undefined;

              return battleStore.upsertBattle({
                showdownId,
                battleRoom: roomName,
                isChamp: player.isChamp,
                result,
                battleStartTime: room.start,
                team,
                showdownUsername: player.name,
                avatar: player.avatar,
              });
            }),
        );

        log('DATABASE', `Successfully stored ${Object.keys(room.participants).length} participants for battle ${roomName}`);
      } catch (error) {
        log('DATABASE', `Error storing participants in battle ${roomName}: ${error}`);
      }
    }, 10000);
  });

  discordClient.on('ready', async () => {
    log('DISCORD', `Successfully logged in as ${discordClient.user?.tag}`);

    showderpMonitor.on(
      'thread',
      createThreadHandler(discordClient, settings.discord.channelId),
    );

    showderpMonitor.on(
      'battlePost',
      createBattlePostHandler(discordClient, settings.discord.channelId),
    );

    showderpMonitor.on(
      'battlePost',
      handleBattlePost,
    );
  });

  discordClient.on('error', console.error);

  discordClient.on('disconnect', () => {
    clearInterval(showderpMonitorTimeout);
    unsubscribeBattleMonitor();
    unsubscribeReactor();
    showdownClient.disconnect();
    showdownUnsubscribeFunctions.forEach((unsubscribeFunction) => unsubscribeFunction());
  });

  logExecution(
    INITIALIZATION_LOG_PREFIX,
    'Connecting to Discord',
    'Connected to Discord',
    async () => await discordClient.login(settings.discord.token),
  );
};
