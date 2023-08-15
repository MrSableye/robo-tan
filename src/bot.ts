import Discord from 'discord.js';
import { ManagedShowdownClient } from 'borygon';
import AWS from 'aws-sdk';
import {
  DynamoDBConfigurationStore,
  InMemoryConfigurationStore,
  OrderedFailThroughStore,
} from './store/configuration/index.js';
import { DynamoDBBattleStore } from './store/battle/index.js';
import { createBattleMonitor } from './showdown/index.js';
import { createReactor, createShowderpMonitor } from './showderp/index.js';
import { BotSettings } from './settings.js';
import { log, logExecution } from './logger.js';
import { DogarsChatClient } from './dogars/index.js';
import { createBattlePostHandler, createThreadHandler } from './discord/index.js';

const INITIALIZATION_LOG_PREFIX = 'INITIALIZATION';

export const createBot = async (settings: BotSettings) => {
  try {
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

    await logExecution(
      INITIALIZATION_LOG_PREFIX,
      'Connecting to Dogars',
      'Connected to Dogars',
      () => dogarsChatClient.connect(),
    );

    const showdownUnsubscribeFunctions = [
      showdownClient.lifecycle.on('connect', () => {
        if (settings.showdown.avatar) {
          showdownClient.send(`|/avatar ${settings.showdown.avatar}`);
        }
      }),
      showdownClient.lifecycle.on('loginAssertion', (loginAssertion) => {
        if (settings.showdown.avatar) {
          showdownClient.send(`|/avatar ${settings.showdown.avatar}`);
        }

        dogarsChatClient.send(`|/trn ${settings.showdown.username},0,${loginAssertion}`);
      }),
      showdownClient.messages.on('initializeRoom', (initializeRoomMessage) => {
        log('DOGARS', `Joining Dogars chat for ${initializeRoomMessage.room}`);
        dogarsChatClient.send(`|/join ${initializeRoomMessage.room}`, 10);
      }),
      showdownClient.messages.on('deinitializeRoom', (deinitializeRoomMessage) => {
        log('DOGARS', `Joining Dogars chat for ${deinitializeRoomMessage.room}`);
        dogarsChatClient.send(`|/leave ${deinitializeRoomMessage.room}`, 10);
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

    await logExecution(
      INITIALIZATION_LOG_PREFIX,
      'Connecting to Showdown',
      'Connected to Showdown',
      () => showdownClient.connect(),
    );

    await logExecution(
      INITIALIZATION_LOG_PREFIX,
      'Logging in to Showdown',
      'Logged in to Showdown',
      () => showdownClient.login(
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

    await logExecution(
      INITIALIZATION_LOG_PREFIX,
      'Connecting to Discord',
      'Connected to Discord',
      () => discordClient.login(settings.discord.token),
    );
  } catch (error) {
    log(INITIALIZATION_LOG_PREFIX, (error as Error)?.message, true);
  }
};
