import { discordEvent, Service } from "@sern/handler";
import { Events } from "discord.js";

export default discordEvent({
	name: Events.GuildMemberRemove,
	async execute(member) {
		const prisma = Service("prisma");

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
