import DynamoDB from 'aws-sdk/clients/dynamodb';

interface ShowdownUser {
  showdownId: string;
  showdownDisplayName: string;
}

interface YotsubaUser {
  tripcode: string;
}

interface DiscordUser {
  discordId: string;
}

export type UserData = ShowdownUser | YotsubaUser;

export type User = DiscordUser
| (DiscordUser & ShowdownUser)
| (DiscordUser & YotsubaUser)
| (DiscordUser & ShowdownUser & YotsubaUser);

export interface UserDatabaseClient {
  upsertUser(user: User): Promise<User>;
  getUser(discordId: string): Promise<User | undefined>;
  deleteUser(discordId: string): Promise<boolean>;
  getUsersByShowdownId(showdownId: string): Promise<User[]>;
  getUsersByTripcode(tripcode: string): Promise<User[]>;
}

export interface DynamoDBUserDatabaseConfiguration {
  userTableName: string;
  showdownIdIndexName: string;
  tripcodeIndexName: string;
}

export class DynamoDBUserDatabaseClient implements UserDatabaseClient {
  client: DynamoDB.DocumentClient;

  configuration: DynamoDBUserDatabaseConfiguration;

  constructor(client: DynamoDB.DocumentClient, configuration: DynamoDBUserDatabaseConfiguration) {
    this.client = client;
    this.configuration = configuration;
  }

  async upsertUser(user: User): Promise<User> {
    const parameters = {
      TableName: this.configuration.userTableName,
      Item: user,
    };

    await this.client.put(parameters).promise();

    return user;
  }

  async getUser(discordId: string): Promise<User | undefined> {
    const parameters = {
      TableName: this.configuration.userTableName,
      Key: { discordId },
    };

    const response = await this.client.get(parameters).promise();

    if (response.Item) {
      return response.Item as User;
    }

    return undefined;
  }

  async deleteUser(discordId: string): Promise<boolean> {
    const parameters: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: this.configuration.userTableName,
      Key: { discordId },
    };

    await this.client.delete(parameters).promise();

    return true;
  }

  async getUsersByShowdownId(showdownId: string): Promise<User[]> {
    const parameters = {
      TableName: this.configuration.userTableName,
      IndexName: this.configuration.showdownIdIndexName,
      ExpressionAttributeNames: {
        '#showdownId': 'showdownId',
      },
      ExpressionAttributeValues: {
        ':showdownId': showdownId,
      },
      KeyConditionExpression: '#showdownId = :showdownId',
    };

    const response = await this.client.query(parameters).promise();

    if (response.Items) {
      return response.Items as User[];
    }

    return [];
  }

  async getUsersByTripcode(tripcode: string): Promise<User[]> {
    const parameters = {
      TableName: this.configuration.userTableName,
      IndexName: this.configuration.tripcodeIndexName,
      ExpressionAttributeNames: {
        '#tripcode': 'tripcode',
      },
      ExpressionAttributeValues: {
        ':tripcode': tripcode,
      },
      KeyConditionExpression: '#tripcode = :tripcode',
    };

    const response = await this.client.query(parameters).promise();

    if (response.Items) {
      return response.Items as User[];
    }

    return [];
  }
}
