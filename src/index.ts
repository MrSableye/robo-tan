import { Client } from 'discord.js';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { createBattleNotifier, createMessageHandler } from './discord';
import { createShowdownVerifier } from './showdown';
import { DatabaseVerificationClient, VerificationClient } from './verification';
import {
  ChallengeDatabaseClient,
  DynamoDBChallengeDatabaseClient,
  DynamoDBUserDatabaseClient,
  UserDatabaseClient,
} from './verification/store';

const token = process.env.TOKEN || '';
const channelId = process.env.CHANNEL_ID || '';
const showdownUsername = process.env.SHOWDOWN_USERNAME || '';
const showdownPassword = process.env.SHOWDOWN_PASSWORD || '';

const dynamoDBClient = new DynamoDB.DocumentClient({});
const challengeDatabaseClient: ChallengeDatabaseClient = new DynamoDBChallengeDatabaseClient(
  dynamoDBClient,
  {
    challengeTableName: 'Challenges',
  },
);
const userDatabaseClient: UserDatabaseClient = new DynamoDBUserDatabaseClient(
  dynamoDBClient,
  {
    userTableName: 'Users',
    showdownIdIndexName: 'showdownId-index',
    tripcodeIndexName: 'tripcode-index',
  },
);
const verificationClient: VerificationClient = new DatabaseVerificationClient(
  challengeDatabaseClient,
  userDatabaseClient,
);

const client = new Client();
let battleNotifierTimeout: NodeJS.Timeout;

client.on('ready', () => {
  console.log(`Successfully logged in as ${client.user?.tag}`);
  createShowdownVerifier(
    {
      username: showdownUsername,
      password: showdownPassword,
    },
    verificationClient,
  );
  battleNotifierTimeout = createBattleNotifier(client, channelId);
});
client.on('message', createMessageHandler(verificationClient, userDatabaseClient));
client.on('disconnect', () => {
  clearInterval(battleNotifierTimeout);
  // TODO: Disconnect from Showdown
});
client.on('error', console.error);

client.login(token);
