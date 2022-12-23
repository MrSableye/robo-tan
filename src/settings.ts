export interface BotSettings {
  discord: {
    token: string;
    channelId: string;
  };
  database: {
    configurationTable: string;
    battleTable: string;
  };
  showdown: {
    username: string;
    password: string;
    avatar?: string;
  };
}
