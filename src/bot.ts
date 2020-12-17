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

interface BotSettings {
  discordSettings: {
    token: string;
    channelId: string;
  };
  databaseSettings: {
    configurationTableName: string;
    challengeTableName: string;
    userTableName: string;
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
      async (battlePostEvent) => {
        const [,, battleRoom] = battlePostEvent;

        console.log(`Monitoring battle: ${battleRoom}`);

        await showdownClient.send(`|/join ${battleRoom}`);
      },
    );
  });

  discordClient.on('message', createMessageHandler(verificationClient, userDatabaseClient));

  discordClient.on('error', console.error);

  discordClient.on('disconnect', () => {
    clearInterval(showderpMonitorTimeout);
    showdownClient.disconnect();
  });

  discordClient.login(settings.discordSettings.token);
};
