import { EmbedField, Message } from 'discord.js';

export type CommandHandler = (message: Message, commandText: string) => Promise<Message>;

export interface RegisteredCommand {
  commands: string[],
  handler: CommandHandler,
  help: EmbedField[],
}
