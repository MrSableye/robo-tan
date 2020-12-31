import { DynamoDB } from 'aws-sdk';
import {
  Challenge,
  ChallengeStore,
  ChallengeType,
} from './types';

interface DynamoDBChallengeStoreConfiguration {
  challengeTableName: string;
}

export class DynamoDBChallengeStore implements ChallengeStore {
  client: DynamoDB.DocumentClient;

  configuration: DynamoDBChallengeStoreConfiguration;

  constructor(
    client: DynamoDB.DocumentClient,
    configuration: DynamoDBChallengeStoreConfiguration,
  ) {
    this.client = client;
    this.configuration = configuration;
  }

  async upsertChallenge(challenge: Challenge): Promise<Challenge> {
    const parameters = {
      TableName: this.configuration.challengeTableName,
      Item: challenge,
    };

    await this.client.put(parameters).promise();

    return challenge;
  }

  async getChallenge(secret: string, type: ChallengeType): Promise<Challenge | undefined> {
    const parameters = {
      TableName: this.configuration.challengeTableName,
      Key: { secret, type },
    };

    const response = await this.client.get(parameters).promise();

    if (response.Item) {
      return response.Item as Challenge;
    }

    return undefined;
  }

  async deleteChallenge(secret: string, type: ChallengeType): Promise<boolean> {
    const parameters: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: this.configuration.challengeTableName,
      Key: { secret, type },
    };

    await this.client.delete(parameters).promise();

    return true;
  }
}
