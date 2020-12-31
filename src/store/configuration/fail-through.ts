import {
  ConfigurationStore,
  GlobalConfiguration,
  GlobalConfigurationKey,
  GuildConfiguration,
  GuildConfigurationKey,
  UserConfiguration,
  UserConfigurationKey,
} from './types';

export class OrderedFailThroughStore implements ConfigurationStore {
  configurationStores: ConfigurationStore[];

  constructor(configurationStores: ConfigurationStore[]) {
    this.configurationStores = configurationStores;
  }

  async getGlobalConfigurationValue<T extends GlobalConfigurationKey>(
    key: T,
  ): Promise<GlobalConfiguration[T] | undefined> {
    let result: GlobalConfiguration[T] | undefined;

    // eslint-disable-next-line no-restricted-syntax
    for (const configurationStore of this.configurationStores) {
      // eslint-disable-next-line no-await-in-loop
      result = await configurationStore.getGlobalConfigurationValue(key);

      if (result) {
        return result;
      }
    }

    return result;
  }

  async setGlobalConfigurationValue<T extends GlobalConfigurationKey>(
    key: T,
    value: GlobalConfiguration[T],
  ): Promise<GlobalConfiguration[T]> {
    await Promise.all(this.configurationStores.map(
      (configurationStore) => configurationStore.setGlobalConfigurationValue(key, value),
    ));

    return value;
  }

  async getGuildConfigurationValue<T extends GuildConfigurationKey>(
    guild: string,
    key: T,
  ): Promise<GuildConfiguration[T] | undefined> {
    let result: GuildConfiguration[T] | undefined;

    // eslint-disable-next-line no-restricted-syntax
    for (const configurationStore of this.configurationStores) {
      // eslint-disable-next-line no-await-in-loop
      result = await configurationStore.getGuildConfigurationValue(guild, key);

      if (result) {
        return result;
      }
    }

    return result;
  }

  async setGuildConfigurationValue<T extends GuildConfigurationKey>(
    guild: string,
    key: T,
    value: GuildConfiguration[T],
  ): Promise<GuildConfiguration[T]> {
    await Promise.all(this.configurationStores.map(
      (configurationStore) => configurationStore.setGuildConfigurationValue(guild, key, value),
    ));

    return value;
  }

  async getUserConfigurationValue<T extends UserConfigurationKey>(
    user: string,
    key: T,
  ): Promise<UserConfiguration[T] | undefined> {
    let result: UserConfiguration[T] | undefined;

    // eslint-disable-next-line no-restricted-syntax
    for (const configurationStore of this.configurationStores) {
      // eslint-disable-next-line no-await-in-loop
      result = await configurationStore.getUserConfigurationValue(user, key);

      if (result) {
        return result;
      }
    }

    return result;
  }

  async setUserConfigurationValue<T extends UserConfigurationKey>(
    user: string,
    key: T,
    value: UserConfiguration[T],
  ): Promise<UserConfiguration[T]> {
    await Promise.all(this.configurationStores.map(
      (configurationStore) => configurationStore.setUserConfigurationValue(user, key, value),
    ));

    return value;
  }
}
