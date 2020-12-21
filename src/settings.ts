export interface BotSettings {
  discordSettings: {
    token: string;
    channelId: string;
  };
  databaseSettings: {
    configurationTableName: string;
    challengeTableName: string;
    userTableName: string;
    battleTableName: string;
    showdownIdIndexName: string;
    tripcodeIndexName: string;
  };
  showdownSettings: {
    username: string;
    password: string;
    avatar?: string;
  };
  awsSettings: {
    roleStepFunctionArn: string;
  }
}
