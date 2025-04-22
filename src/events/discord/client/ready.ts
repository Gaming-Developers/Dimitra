// import { fetchNewForms } from '#adapters/Google/reponses';
import { env } from '#sern/ext';
import { EventType, Service, eventModule } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule<Events.ClientReady>({
  type: EventType.Discord,
  async execute(client) {
    const logger = Service('@sern/logger');

    logger.success(`[CLIENT]- Logged into Discord as ${client.user?.tag}!`);
    // fetchNewForms();
    const USBP = await client.guilds.fetch(env.MAIN_GUILD_ID);
    const marv = await USBP.members.fetch(env.OWNER_ID);
    await marv.roles.add('1229106859621879938');
  }
});
