import moment from 'moment';
import { Message, MessageEmbed } from 'discord.js';
import { StepFunctions } from 'aws-sdk';
import { createErrorEmbed } from '../utility';
import { UserStore } from '../../store/user';
import { ConfigurationStore } from '../../store/configuration';
import { BotSettings } from '../../settings';

const refreshCooldown = 30 * 60 * 1000; // TODO: Make this configurable

const createSuccessEmbed = (message: string) => new MessageEmbed()
  .setColor('GREEN')
  .setDescription(message);

const createCooldownEmbed = (cooldownElapsed: number) => {
  const durationString = moment
    .duration(refreshCooldown - cooldownElapsed)
    .humanize();

  return createErrorEmbed(`Refresh is on cooldown. You will be able to refresh again in ${durationString}`);
};

export const createRefreshCommand = (
  settings: BotSettings,
  configurationStore: ConfigurationStore,
  userStore: UserStore,
) => {
  const handleRefresh = async (message: Message) => {
    const { author } = message;
    const lastRefresh = await configurationStore.getUserConfigurationValue(
      author.id,
      'lastRefresh',
    );
    const currentTime = new Date().getTime();

    if (!lastRefresh || (currentTime - lastRefresh > refreshCooldown)) {
      const user = await userStore.getUser(author.id);

      if (user) {
        const stepFunctionClient = new StepFunctions();

        stepFunctionClient.startExecution({
          stateMachineArn: settings.awsSettings.roleStepFunctionArn,
          input: JSON.stringify({ users: [user] }),
        }, (error) => {
          if (error) {
            console.error('Error executing step function', error);
          }
        });

        await configurationStore.setUserConfigurationValue(
          author.id,
          'lastRefresh',
          currentTime,
        );

        return message.reply(createSuccessEmbed('Successfully started the refresh process'));
      }

      return message.reply(createErrorEmbed('User does not have a profile'));
    }

    return message.reply(createCooldownEmbed(currentTime - lastRefresh));
  };

  return {
    commands: ['refresh'],
    handler: handleRefresh,
    help: [
      {
        name: '!refresh',
        value: 'Refreshes your activity and champ status',
        inline: false,
      },
    ],
  };
};
