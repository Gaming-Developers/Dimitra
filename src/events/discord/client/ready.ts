import { fetchNewForms } from "#adapters/Google/reponses";
import { Services, discordEvent } from "@sern/handler";
import { Events } from "discord.js";

export default discordEvent({
  name: Events.ClientReady,
  async execute() {
    const [client, logger] = Services("@sern/client", "@sern/logger");

    logger.success(`[CLIENT]- Logged into Discord as ${client.user?.tag}!`);
    await fetchNewForms(2);
  },
});
