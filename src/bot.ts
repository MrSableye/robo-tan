import Discord from 'discord.js';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import {
  DynamoDBConfigurationStore,
  InMemoryConfigurationStore,
  OrderedFailThroughStore,
} from './configuration';
import {
  createBattlePostHandler,
  createThreadHandler,
  createMessageHandler,
  createChallengePostHandler,
} from './discord';
import { createShowderpMonitor } from './showderp';
import { createShowdownClient } from './showdown';
import {
  ChallengeDatabaseClient,
  DynamoDBChallengeDatabaseClient,
  DynamoDBUserDatabaseClient,
  DatabaseVerificationClient,
  UserDatabaseClient,
  VerificationClient,
} from './verification';
import { createBattleMonitor } from './showdown/battle-monitor';
import { BattleDatabaseClient, DynamoDBBattleDatabaseClient } from './verification/battle-store';

interface BotSettings {
  discordSettings: {
    token: string;
    channelId: string;
  };
  databaseSettings: {
    configurationTableName: string;
    challengeTableName: string;
    userTableName: string;
    battleTableName: string;
    showdownIdIndexName: string;
    tripcodeIndexName: string;
  };
  showdownSettings: {
    username: string;
    password: string;
    avatar?: string;
  };
}

// eslint-disable-next-line import/prefer-default-export
export const createBot = async (settings: BotSettings) => {
  const dynamoDBClient = new DynamoDB.DocumentClient();

  const challengeDatabaseClient: ChallengeDatabaseClient = new DynamoDBChallengeDatabaseClient(
    dynamoDBClient,
    {
      challengeTableName: settings.databaseSettings.challengeTableName,
    },
  );

  const userDatabaseClient: UserDatabaseClient = new DynamoDBUserDatabaseClient(
    dynamoDBClient,
    {
      userTableName: settings.databaseSettings.userTableName,
      showdownIdIndexName: settings.databaseSettings.showdownIdIndexName,
      tripcodeIndexName: settings.databaseSettings.tripcodeIndexName,
    },
  );

  const verificationClient: VerificationClient = new DatabaseVerificationClient(
    challengeDatabaseClient,
    userDatabaseClient,
  );

  const battleDatabaseClient: BattleDatabaseClient = new DynamoDBBattleDatabaseClient(
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

  const [showderpMonitorTimeout, showderpMonitor] = await createShowderpMonitor(
    15 * 1000,
    configurationStore,
  );
  const showdownClient = createShowdownClient(verificationClient);

  const {
    battleEventEmitter,
    battlePostHandler,
    unsubscribe: unsubscribeBattleMonitor,
  } = createBattleMonitor(showdownClient);

  battleEventEmitter.on('start', ({ roomName }) => console.log(`Battle started: ${roomName}`));
  battleEventEmitter.on('end', async ({ roomName, room }) => {
    try {
      await Promise.all(
        Object.entries(room.participants)
          .map(([showdownId, { isChamp }]) => battleDatabaseClient.upsertBattle({
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
      createChallengePostHandler(discordClient, verificationClient),
    );

    await showdownClient.connect();
    await showdownClient.login(
      settings.showdownSettings.username,
      settings.showdownSettings.password,
    );

    showderpMonitor.on(
      'battlePost',
      battlePostHandler,
    );
  });

  discordClient.on('message', createMessageHandler(verificationClient, userDatabaseClient));

  discordClient.on('error', console.error);

  discordClient.on('disconnect', () => {
    clearInterval(showderpMonitorTimeout);
    unsubscribeBattleMonitor();
    showdownClient.disconnect();
  });

  discordClient.login(settings.discordSettings.token);
};
