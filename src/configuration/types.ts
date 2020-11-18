export interface GlobalConfiguration {
  currentThread: number;
  lastExecutedTime: number;
}

export type GlobalConfigurationKey = keyof GlobalConfiguration;

export interface GuildConfiguration {
  prefix: string;
}

export type GuildConfigurationKey = keyof GuildConfiguration;

export interface ConfigurationStore {
  getGlobalConfigurationValue<T extends GlobalConfigurationKey>(
    key: T,
  ): Promise<GlobalConfiguration[T] | undefined>;
  setGlobalConfigurationValue<T extends GlobalConfigurationKey>(
    key: T,
    value: GlobalConfiguration[T],
  ): Promise<GlobalConfiguration[T]>;
  getGuildConfigurationValue<T extends GuildConfigurationKey>(
    guild: string,
    key: T,
  ): Promise<GuildConfiguration[T] | undefined>;
  setGuildConfigurationValue<T extends GuildConfigurationKey>(
    guild: string,
    key: T,
    value: GuildConfiguration[T],
  ): Promise<GuildConfiguration[T]>;
}
