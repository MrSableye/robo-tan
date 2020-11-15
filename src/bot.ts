import Discord from 'discord.js';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import {
  createBattlePostHandler,
  createThreadHandler,
  createMessageHandler,
  createChallengePostHandler,
} from './discord';
import { createShowderpMonitor } from './showderp';
import { createShowdownVerifier } from './showdown';
import { DatabaseVerificationClient, VerificationClient } from './verification';
import {
  ChallengeDatabaseClient,
  DynamoDBChallengeDatabaseClient,
  DynamoDBUserDatabaseClient,
  UserDatabaseClient,
} from './verification/store';

interface BotSettings {
  discordSettings: {
    token: string;
    channelId: string;
  };
  databaseSettings: {
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

  const discordClient = new Discord.Client();

  const [showderpMonitorTimeout, showderpMonitor] = createShowderpMonitor(15 * 1000);
  const showdownVerifier = createShowdownVerifier(settings.showdownSettings, verificationClient);

  discordClient.on('ready', () => {
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

    showdownVerifier.connect();
  });

  discordClient.on('message', createMessageHandler(verificationClient, userDatabaseClient));

  discordClient.on('error', console.error);

  discordClient.on('disconnect', () => {
    clearInterval(showderpMonitorTimeout);
    showdownVerifier.disconnect();
  });

  discordClient.login(settings.discordSettings.token);
};
