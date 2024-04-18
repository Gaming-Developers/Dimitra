import { discordEvent, Service } from "@sern/handler";
import { Events } from "discord.js";

export default discordEvent({
	name: Events.GuildDelete,
	execute: async (guild) => {
		const guildSchema = Service("prisma").guilds;
		await guildSchema.delete({
			where: {
				id: guild.id
			}
		});
	}
});
