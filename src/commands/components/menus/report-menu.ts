import { commandModule, CommandType, Service } from "@sern/handler";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ComponentType,
	ModalBuilder,
	OverwriteType,
	PermissionFlagsBits,
	PrivateThreadChannel,
	StringSelectMenuBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";

export default commandModule({
	name: "report-menu",
	type: CommandType.StringSelect,
	plugins: [],
	execute: async (menu) => {
		const prisma = Service("prisma");
		const db = prisma.dmreports;

		const userId = menu.user.id;
		const [thread] = menu.values;
		const [authorId, threadId] = thread.split("_");

		const found = await db.findUnique({
			where: { id: authorId, reports: { some: { threadId } } }
		});

		if (authorId !== userId) {
			return await menu.reply({
				content: `This menu is only for <@${authorId}>`,
				ephemeral: true
			});
		}

		await menu.deferUpdate({ fetchReply: true });
		const guild = menu.client.guilds.cache.get(menu.guildId!);

		try {
			if (guild) {
				const threadChan = guild.channels.cache.find(
					(channel) => channel.isThread() && channel.id === threadId
				) as PrivateThreadChannel;
				if (!threadChan) {
					return;
				}

				const modal = new ModalBuilder({
					custom_id: "report-add",
					title: "Add yourself to the report thread.",
					components: [
						new ActionRowBuilder<TextInputBuilder>({
							type: ComponentType.TextInput,
							components: [
								new TextInputBuilder({
									custom_id: "thread-id",
									label: "Please provide the matching thread id!",
									min_length: 19,
									placeholder: "Thread Id",
									required: true,
									style: TextInputStyle.Short,
									type: ComponentType.TextInput
								})
							]
						})
					]
				});
				await menu.showModal(modal);
				let match = false;
				await menu
					.awaitModalSubmit({
						time: 20000,
						componentType: ComponentType.TextInput,
						filter: (i) =>
							i.user.id === authorId &&
							i.customId === "report-add"
					})
					.then(async (int) => {
						const threadID =
							int.fields.getTextInputValue("thread-id");
						if (thread === threadID) {
							match = true;
							await int.reply({
								content:
									"Thank you for providing the correct info!",
								ephemeral: true
							});
						} else {
							match = false;
							await int.reply({
								content:
									"Sorry, that id was incorrect! Please try again!",
								ephemeral: true
							});
						}
					});

				if (match) {
					await threadChan.members.add(authorId);
					const { originalMessage } = found!.reports.find(
						(r) => r.threadId === threadId
					)!;
					const urlParts = originalMessage.split("/");
					const channelId = urlParts[5];
					const messageId = urlParts[6];

					const channel = await menu.client.channels.fetch(channelId);
					if (channel?.type !== ChannelType.DM) {
						return;
					} else {
						const msg = await channel.messages.fetch(messageId);

						const components = [
							new ActionRowBuilder<ButtonBuilder>({
								components: ["Invite", "View Thread"].map(
									(choice) =>
										new ButtonBuilder({
											label: choice,
											style: ButtonStyle.Link,
											url:
												choice === "Invite"
													? "https://discord.gg/zVMKPRFudD"
													: threadChan.url
										})
								)
							})
						];

						await msg.edit({
							components
						});
						const selectMenuRow = ActionRowBuilder.from(
							menu.message.components[0]
						) as ActionRowBuilder;
						const selectMenu = selectMenuRow
							.components[0] as StringSelectMenuBuilder;
						const menuOptions = selectMenu.options;
						const selectedOption = menuOptions.findIndex(
							(opt) => opt.data.value === thread
						);

						if (selectedOption !== -1) {
							const isLastOption =
								selectedOption === menuOptions.length - 1;

							const updatedOptions = menuOptions.filter(
								(component) => component.data.value !== thread
							);

							selectMenu.setOptions(...updatedOptions);

							const newMenu =
								new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
									selectMenu
								);

							await menu.message.edit({
								components: [newMenu]
							});

							await menu.followUp({
								content:
									"I have added you to the thread! Click the button that I activated in our DM's to view it!",
								ephemeral: true
							});

							if (isLastOption) {
								await menu.message.delete();

								const channel = menu.channel as TextChannel;
								const permissions =
									channel.permissionOverwrites.resolve(
										authorId
									);

								if (
									permissions &&
									permissions.type === OverwriteType.Member &&
									permissions.allow.has(
										PermissionFlagsBits.ViewChannel
									)
								) {
									await permissions.delete(
										"Finished adding self to reports."
									);
								}
							}
						}
					}
				}
			}
		} catch (error) {
			Service("@sern/logger").error(error);
		}
	}
});
