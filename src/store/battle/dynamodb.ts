import { DynamoDB } from 'aws-sdk';
import {
  Battle,
  BattleStore,
} from './types';

interface DynamoDBBattleStoreConfiguration {
  battleTableName: string;
}

export class DynamoDBBattleStore implements BattleStore {
  client: DynamoDB.DocumentClient;

  configuration: DynamoDBBattleStoreConfiguration;

  constructor(
    client: DynamoDB.DocumentClient,
    configuration: DynamoDBBattleStoreConfiguration,
  ) {
    this.client = client;
    this.configuration = configuration;
  }

  async upsertBattle(battle: Battle): Promise<Battle> {
    const parameters = {
      TableName: this.configuration.battleTableName,
      Item: battle,
    };

    await this.client.put(parameters).promise();

    return battle;
  }

  async getBattle(showdownId: string, battleRoom: string): Promise<Battle | undefined> {
    const parameters = {
      TableName: this.configuration.battleTableName,
      Key: { showdownId, battleRoom },
    };

    const response = await this.client.get(parameters).promise();

    if (response.Item) {
      return response.Item as Battle;
    }

    return undefined;
  }

  async deleteBattle(showdownId: string, battleRoom: string): Promise<boolean> {
    const parameters: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: this.configuration.battleTableName,
      Key: { showdownId, battleRoom },
    };

    await this.client.delete(parameters).promise();

    return true;
  }
}
