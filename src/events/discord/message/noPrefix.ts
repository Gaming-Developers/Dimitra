import { deleteOnTimeout } from '#utils';
import { discordEvent, Service } from '@sern/handler';

export default discordEvent({
	name: 'messageCreate',
	execute: async (message) => {
		const client = Service('@sern/client');
		if (message.author.bot) return;
		const prefixRegex = new RegExp(`^(<@!?${client.user?.id}>)\\s*`);
		if (
			(message.content.startsWith('vb!') &&
				!process.env.OWNER_IDS?.includes(message.author.id)) ||
			prefixRegex.test(message.content)
		) {
			const com = (await client.application?.commands.fetch())?.find(
				(cmd) => cmd.name === 'help'
			);
			const reply = await message.channel.send({
				content: `I apologize, but I do not support prefix commands. Please run </help:${com?.id}> to learn about my commands and features.`,
			});
			await deleteOnTimeout([message, reply], 10000);
		}
	},
});
