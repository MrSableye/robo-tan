import DynamoDB from 'aws-sdk/clients/dynamodb';

export interface User {
  discordId: string;
  showdownIds?: string[];
  tripcode?: string;
}

export interface UserDatabaseClient {
  upsertUser(user: User): Promise<User>;
  getUser(discordId: string): Promise<User | undefined>;
  deleteShowdownId(discordId: string): Promise<User | undefined>;
  deleteTripcode(discordId: string): Promise<User | undefined>;
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

    return response.Item as User;
  }

  async deleteShowdownId(discordId: string): Promise<User | undefined> {
    const user = await this.getUser(discordId);

    if (user && 'showdownId' in user) {
      // @ts-ignore
      delete user.showdownId;
      // @ts-ignore
      delete user.showdownDisplayName;

      return this.upsertUser(user);
    }

    return undefined;
  }

  async deleteTripcode(discordId: string): Promise<User | undefined> {
    const user = await this.getUser(discordId);

    if (user && 'tripcode' in user) {
      // @ts-ignore
      delete user.tripcode;

      return this.upsertUser(user);
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
