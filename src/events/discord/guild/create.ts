import { eventModule, EventType, Service } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule<Events.GuildCreate>({
  type: EventType.Discord,
  execute: async guild => {
    const guildSchema = Service('prisma').guilds;
    await guildSchema.upsert({
      where: {
        id: guild.id
      },
      create: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon ? guild.iconURL() : null,
        channels: {
          allCountChan: '',
          botCountChan: '',
          leaveChan: '',
          userCountChan: '',
          welcomeChan: '',
          moderatorChan: '',
          rulesChan: ''
        }
      },
      update: {
        name: guild.name,
        icon: guild.icon ? guild.iconURL() : null,
        channels: {
          allCountChan: '',
          botCountChan: '',
          leaveChan: '',
          userCountChan: '',
          welcomeChan: '',
          moderatorChan: '',
          rulesChan: ''
        }
      }
    });
  }
});
