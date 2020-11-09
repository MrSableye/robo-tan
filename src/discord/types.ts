import { Message } from 'discord.js';

export type CommandHandler = (message: Message, commandText: string) => Promise<void>;

export interface RegisteredCommand {
  commands: string[],
  handler: CommandHandler,
}
