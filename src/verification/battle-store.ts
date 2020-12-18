import DynamoDB from 'aws-sdk/clients/dynamodb';

interface Battle {
  showdownId: string;
  battleRoom: string;
  isChamp: boolean;
  battleStartTime: number;
}

export interface BattleDatabaseClient {
  upsertBattle(battle: Battle): Promise<Battle>;
  getBattle(showdownId: string, battleRoom: string): Promise<Battle | undefined>;
  deleteBattle(showdownId: string, battleRoom: string): Promise<boolean>;
}

export interface DynamoDBBattleDatabaseConfiguration {
  battleTableName: string;
}

export class DynamoDBBattleDatabaseClient implements BattleDatabaseClient {
  client: DynamoDB.DocumentClient;

  configuration: DynamoDBBattleDatabaseConfiguration;

  constructor(
    client: DynamoDB.DocumentClient,
    configuration: DynamoDBBattleDatabaseConfiguration,
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
