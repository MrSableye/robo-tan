import Discord from 'discord.js';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import { StringVerificationClient } from './verification';
import { DynamoDBUserStore } from './store/user';
import {
  DynamoDBConfigurationStore,
  InMemoryConfigurationStore,
  OrderedFailThroughStore,
} from './store/configuration';
import { ChallengeType, DynamoDBChallengeStore } from './store/challenge';
import { DynamoDBBattleStore } from './store/battle';
import {
  createBattleMonitor,
  createVerificationMonitor,
} from './showdown';
import { createShowderpMonitor } from './showderp';
import { BotSettings } from './settings';
import {
  createBattlePostHandler,
  createChallengePostHandler,
  createMessageHandler,
  createThreadHandler,
} from './discord';

export const createBot = async (settings: BotSettings) => {
  const dynamoDBClient = new DynamoDB.DocumentClient();

  const challengeStore = new DynamoDBChallengeStore(
    dynamoDBClient,
    {
      challengeTableName: settings.databaseSettings.challengeTableName,
    },
  );

  const userStore = new DynamoDBUserStore(
    dynamoDBClient,
    {
      userTableName: settings.databaseSettings.userTableName,
      showdownIdIndexName: settings.databaseSettings.showdownIdIndexName,
      tripcodeIndexName: settings.databaseSettings.tripcodeIndexName,
    },
  );

  const showdownVerificationClient = new StringVerificationClient(
    ChallengeType.SHOWDOWN,
    challengeStore,
    userStore,
  );

  const yotsubaVerificationClient = new StringVerificationClient(
    ChallengeType.YOTSUBA,
    challengeStore,
    userStore,
  );

  const battleStore = new DynamoDBBattleStore(
    dynamoDBClient,
    {
      battleTableName: settings.databaseSettings.battleTableName,
    },
  );

  const dynamoDBConfigurationStore = new DynamoDBConfigurationStore(
    dynamoDBClient,
    settings.databaseSettings.configurationTableName,
  );
  const inMemoryConfigurationStore = new InMemoryConfigurationStore();
  const configurationStore = new OrderedFailThroughStore([
    inMemoryConfigurationStore,
    dynamoDBConfigurationStore,
  ]);

  const discordClient = new Discord.Client();

  const {
    timeout: showderpMonitorTimeout,
    showderpMonitor,
  } = await createShowderpMonitor(
    15 * 1000,
    configurationStore,
  );

  const showdownClient = new PrettyClient({
    debug: true,
    debugPrefix: '[SHOWDOWN CLIENT]',
  });

  const {
    battleEventEmitter,
    battlePostHandler,
    unsubscribe: unsubscribeBattleMonitor,
  } = createBattleMonitor(showdownClient);

  const {
    unsubscribe: unsubscribeVerificationMonitor,
  } = createVerificationMonitor(showdownClient, showdownVerificationClient);

  const roomPromise = new Promise<string[]>((resolve) => {
    showdownClient.eventEmitter.on('default', (defaultEvent) => {
      if (defaultEvent.rawEventName === 'queryresponse') {
        const [responseType, response] = defaultEvent.event[0];
        if (responseType && responseType === 'rooms' && response) {
          const { official, chat } = JSON.parse(response);

          if (official && Array.isArray(official) && chat && Array.isArray(chat)) {
            resolve([
              ...official.map((officialChat: { title: string }) => officialChat.title),
              ...chat.map((chatRoom: { title: string }) => chatRoom.title),
            ]);
          }
        }
      }
    });
  });

  await showdownClient.connect();
  await showdownClient.login(
    settings.showdownSettings.username,
    settings.showdownSettings.password,
  );

  const rooms = await roomPromise;
  console.log(rooms);

  battleEventEmitter.on('start', ({ roomName }) => console.log(`Battle started: ${roomName}`));
  battleEventEmitter.on('end', async ({ roomName, room }) => {
    try {
      await Promise.all(
        Object.entries(room.participants)
          .map(([showdownId, { isChamp }]) => battleStore.upsertBattle({
            showdownId,
            battleRoom: roomName,
            isChamp,
            battleStartTime: room.start,
          })),
      );

      console.log(`Successfully stored ${Object.keys(room.participants).length} participants for battle ${roomName}`);
    } catch (error) {
      console.log(`Error storing participants in battle ${roomName}: ${error}`);
    }
  });

  discordClient.on('ready', async () => {
    console.log(`Successfully logged in as ${discordClient.user?.tag}`);

    showderpMonitor.on(
      'thread',
      createThreadHandler(discordClient, settings.discordSettings.channelId),
    );

    showderpMonitor.on(
      'battlePost',
      createBattlePostHandler(discordClient, settings.discordSettings.channelId),
    );

    showderpMonitor.on(
      'challengePosts',
      createChallengePostHandler(discordClient, yotsubaVerificationClient),
    );

    showderpMonitor.on(
      'battlePost',
      battlePostHandler,
    );
  });

  discordClient.on('message', createMessageHandler(
    settings,
    configurationStore,
    showdownVerificationClient,
    yotsubaVerificationClient,
    userStore,
  ));

  discordClient.on('error', console.error);

  discordClient.on('disconnect', () => {
    clearInterval(showderpMonitorTimeout);
    unsubscribeBattleMonitor();
    unsubscribeVerificationMonitor();
    showdownClient.disconnect();
  });

  discordClient.login(settings.discordSettings.token);
};
