import { eventModule, EventType, Service } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule<Events.GuildMemberRemove>({
  type: EventType.Discord,
  async execute(member) {
    const prisma = Service('prisma');

    //HANDLE MEMBERS JOINING GUILDS
    const guildSettings = prisma.guilds;
    const settings = await guildSettings.findFirst({
      where: { id: member.guild.id }
    });
    if (settings) {
      const { leaveChan } = settings.channels!;
    }
  }
});
