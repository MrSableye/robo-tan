import Discord from 'discord.js';
import { DynamoDB } from 'aws-sdk';
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

export const createBot = async (settings: BotSettings) => {
  const dynamoDBClient = new DynamoDB.DocumentClient();

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

  console.time('Connected to Dogars');
  await dogarsChatClient.connect();
  console.timeEnd('Connected to Dogars');

  const showdownUnsubscribeFunctions = [
    showdownClient.lifecycleEmitter.on('loginAssertion', (loginAssertion) => {
      dogarsChatClient.send(`|/trn ${settings.showdown.username},${settings.showdown.avatar || '0'},${loginAssertion}`);
    }),
    showdownClient.eventEmitter.on('initializeRoom', (initializeRoomEvent) => {
      console.log(`Joining Dogars chat for ${initializeRoomEvent.room}`);
      dogarsChatClient.send(`|/join ${initializeRoomEvent.room}`, 10);
    }),
    showdownClient.eventEmitter.on('deinitializeRoom', (deinitializeRoomEvent) => {
      console.log(`Joining Dogars chat for ${deinitializeRoomEvent.room}`);
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

  console.time('Connected to Showdown');
  await showdownClient.connect();
  console.timeEnd('Connected to Showdown');

  console.time('Logged into Showdown');
  await showdownClient.login(
    settings.showdown.username,
    settings.showdown.password,
  );
  console.timeEnd('Logged into Showdown');

  let previousRoom: string;

  battleEventEmitter.on('start', ({ roomName }) => {
    console.log(`Battle started: ${roomName}`);

    if (previousRoom) {
      dogarsChatClient.send(`${previousRoom}|https://play.dogars.org/${roomName}`);
    }

    previousRoom = roomName;
  });

  battleEventEmitter.on('end', async ({ roomName, room }) => {
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

        console.log(`Successfully stored ${Object.keys(room.participants).length} participants for battle ${roomName}`);
      } catch (error) {
        console.log(`Error storing participants in battle ${roomName}: ${error}`);
      }
    }, 10000);
  });

  discordClient.on('ready', async () => {
    console.log(`Successfully logged in as ${discordClient.user?.tag}`);

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

  console.time('Connected to Discord');
  await discordClient.login(settings.discord.token);
  console.timeEnd('Connected to Discord');
};
