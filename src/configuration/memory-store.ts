import Cache from 'node-cache';
import {
  ConfigurationStore,
  GlobalConfiguration,
  GlobalConfigurationKey,
  GuildConfiguration,
  GuildConfigurationKey,
} from './types';

// eslint-disable-next-line import/prefer-default-export
export class InMemoryConfigurationStore implements ConfigurationStore {
  cache: Cache;

  constructor(ttl?: number) {
    this.cache = new Cache({ stdTTL: ttl });
  }

  getGlobalConfigurationValue<T extends GlobalConfigurationKey>(
    key: T,
  ): Promise<GlobalConfiguration[T] | undefined> {
    return Promise.resolve(this.cache.get(`GLOBAL:${key}`));
  }

  setGlobalConfigurationValue<T extends GlobalConfigurationKey>(
    key: T,
    value: GlobalConfiguration[T],
  ): Promise<GlobalConfiguration[T]> {
    this.cache.set(`GLOBAL:${key}`, value);
    return Promise.resolve(value);
  }

  getGuildConfigurationValue<T extends GuildConfigurationKey>(
    guild: string,
    key: T,
  ): Promise<GuildConfiguration[T] | undefined> {
    return Promise.resolve(this.cache.get(`GUILD:${guild};KEY:${key}`));
  }

  setGuildConfigurationValue<T extends GuildConfigurationKey>(
    guild: string,
    key: T,
    value: GuildConfiguration[T],
  ): Promise<GuildConfiguration[T]> {
    this.cache.set(`GUILD:${guild};KEY:${key}`, value);
    return Promise.resolve(value);
  }
}
