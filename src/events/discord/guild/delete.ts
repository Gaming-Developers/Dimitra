import { eventModule, EventType, Service } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule<Events.GuildDelete>({
  type: EventType.Discord,
  execute: async guild => {
    const guildSchema = Service('prisma').guilds;
    await guildSchema.delete({
      where: {
        id: guild.id
      }
    });
  }
});
