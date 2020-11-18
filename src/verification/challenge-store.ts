import DynamoDB from 'aws-sdk/clients/dynamodb';

export enum ChallengeType {
  SHOWDOWN = 'SHOWDOWN',
  YOTSUBA = 'YOTSUBA',
}

export interface Challenge {
  secret: string;
  type: ChallengeType;
  discordId: string;
  expiryTime: number;
}

export interface ChallengeDatabaseClient {
  upsertChallenge(challenge: Challenge): Promise<Challenge>;
  getChallenge(secret: string, type: ChallengeType): Promise<Challenge | undefined>;
  deleteChallenge(secret: string, type: ChallengeType): Promise<boolean>;
}

export interface DynamoDBChallengeDatabaseConfiguration {
  challengeTableName: string;
}

export class DynamoDBChallengeDatabaseClient implements ChallengeDatabaseClient {
  client: DynamoDB.DocumentClient;

  configuration: DynamoDBChallengeDatabaseConfiguration;

  constructor(
    client: DynamoDB.DocumentClient,
    configuration: DynamoDBChallengeDatabaseConfiguration,
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
