import Discord from 'discord.js';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { PrettyClient } from '@showderp/pokemon-showdown-ts';
import {
  StringVerificationClient,
  StringListVerificationClient,
} from './verification';
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
  toId,
} from './showdown';
import { createShowderpMonitor } from './showderp';
import { BotSettings } from './settings';
import { DogarsChatClient } from './dogars';
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

  const dogarsChatClient = new DogarsChatClient({});
  await dogarsChatClient.connect();

  dogarsChatClient.send(`|/trn ${settings.showdownSettings.username},0,sneed`);

  dogarsChatClient.eventEmitter.on('message', (messageEvent) => {
    if (toId(messageEvent.message).includes(toId(`hi ${settings.showdownSettings.username}`))) {
      dogarsChatClient.send(`${messageEvent.room}|hi ${messageEvent.user}`);
    }
  });

  showdownClient.eventEmitter.on('initializeRoom', (initializeRoomEvent) => {
    console.log(`Joining Dogars chat for ${initializeRoomEvent.room}`);
    dogarsChatClient.send(`|/join ${initializeRoomEvent.room}`, 10);
  });

  showdownClient.eventEmitter.on('deinitializeRoom', (deinitializeRoomEvent) => {
    console.log(`Joining Dogars chat for ${deinitializeRoomEvent.room}`);
    dogarsChatClient.send(`|/leave ${deinitializeRoomEvent.room}`, 10);
  });

  const {
    battleEventEmitter,
    battlePostHandler,
    unsubscribe: unsubscribeBattleMonitor,
  } = createBattleMonitor(showdownClient);

  const {
    unsubscribe: unsubscribeVerificationMonitor,
  } = createVerificationMonitor(showdownClient, showdownVerificationClient);

  await showdownClient.connect();
  await showdownClient.login(
    settings.showdownSettings.username,
    settings.showdownSettings.password,
  );

  const [roomQueryResponse] = await Promise.all([
    showdownClient.receive('queryResponse', 10000, (queryResponseEvent) => {
      const { responseType } = queryResponseEvent.event[0];
      return responseType === 'rooms';
    }),
    showdownClient.send('|/cmd rooms'),
  ]);

  const {
    official: officialChatRooms,
    chat: chatRooms,
  } = JSON.parse(roomQueryResponse.event[0].response);

  const rooms = [
    ...(officialChatRooms || []),
    ...(chatRooms || []),
  ].map((chatRoom: { title: string }) => toId(chatRoom.title));

  const showdownRoomVerificationClient = new StringListVerificationClient(
    ChallengeType.SHOWDOWN_ROOM,
    challengeStore,
    userStore,
    rooms,
    3,
  );

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
    showdownRoomVerificationClient,
    showdownClient,
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
