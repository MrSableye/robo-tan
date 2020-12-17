import DynamoDB from 'aws-sdk/clients/dynamodb';
import {
  ConfigurationStore,
  GlobalConfiguration,
  GlobalConfigurationKey,
  GuildConfiguration,
  GuildConfigurationKey,
} from './types';

// eslint-disable-next-line import/prefer-default-export
export class DynamoDBConfigurationStore implements ConfigurationStore {
  client: DynamoDB.DocumentClient;

  tableName: string;

  constructor(client: DynamoDB.DocumentClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  async getGlobalConfigurationValue<T extends GlobalConfigurationKey>(
    key: T,
  ): Promise<GlobalConfiguration[T] | undefined> {
    const parameters = {
      TableName: this.tableName,
      Key: { key: `GLOBAL:${key}` },
    };

    const response = await this.client.get(parameters).promise();

    if (response.Item) {
      return response.Item.value as GlobalConfiguration[T];
    }

    return undefined;
  }

  async setGlobalConfigurationValue<T extends GlobalConfigurationKey>(
    key: T,
    value: GlobalConfiguration[T],
  ): Promise<GlobalConfiguration[T]> {
    const parameters = {
      TableName: this.tableName,
      Item: { key: `GLOBAL:${key}`, value },
    };

    await this.client.put(parameters).promise();

    return value;
  }

  async getGuildConfigurationValue<T extends GuildConfigurationKey>(
    guild: string,
    key: T,
  ): Promise<GuildConfiguration[T] | undefined> {
    const parameters = {
      TableName: this.tableName,
      Key: { key: `GUILD:${guild};KEY:${key}` },
    };

    const response = await this.client.get(parameters).promise();

    if (response.Item) {
      return response.Item.value as GuildConfiguration[T];
    }

    return undefined;
  }

  async setGuildConfigurationValue<T extends GuildConfigurationKey>(
    guild: string,
    key: T,
    value: GuildConfiguration[T],
  ): Promise<GuildConfiguration[T]> {
    const parameters = {
      TableName: this.tableName,
      Item: { key: `GUILD:${guild};KEY:${key}`, value },
    };

    await this.client.put(parameters).promise();

    return value;
  }
}