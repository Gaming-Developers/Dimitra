import { fetchNewForms } from "#adapters/Google/reponses";
import { Paginator } from "#adapters/Paginator";
import { EventType, Services, eventModule } from "@sern/handler";
import { Events, TextChannel } from "discord.js";

export default eventModule({
  type: EventType.Discord,
  name: Events.ClientReady,
  async execute() {
    const [client, logger] = Services("@sern/client", "@sern/logger");

    logger.success(`[CLIENT]- Logged into Discord as ${client.user?.tag}!`);
    await fetchNewForms(2);


    // const guilds = Array.from(client.guilds.cache.values());

    // for (const guild of guilds) {
    //   await guild.commands.set([]);
    // }
    // await Service("@sern/client").application?.commands.set([]);
  },
});
