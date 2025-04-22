import { delay } from '#sern/ext';
import { eventModule, EventType, Service } from '@sern/handler';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Events,
  SelectMenuComponentOptionData,
  StringSelectMenuBuilder,
  TextChannel
} from 'discord.js';

export default eventModule<Events.GuildMemberAdd>({
  type: EventType.Discord,
  async execute(member) {
    const prisma = Service('prisma');
    const db = prisma.dmreports;
    let members = await db.findMany({});
    //HANDLE REPORTS
    if (member.guild.id === '1228509238889021502' && members.some(m => m.id === member.id)) {
      const reports = members.find(m => m.id === member.id)?.reports!;
      if (reports?.length! > 0) {
        const report_chan = (await member.guild.channels.fetch('1209991920269660170')) as TextChannel;
        await delay(2.5);
        await report_chan.permissionOverwrites.edit(member, {
          ViewChannel: true,
          ReadMessageHistory: true
        });

        const options: SelectMenuComponentOptionData[] = [];
        let optCount = 0;
        for (const report of reports!) {
          const { count, threadId } = report;
          options.push({
            label: `Report #${count}`,
            value: member.id + '_' + threadId,
            description: 'Add yourself to this report!'
          });
          optCount++;
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
          components: [
            new StringSelectMenuBuilder({
              custom_id: 'report-menu',
              placeholder: 'Select an option to be added to a report!',
              type: ComponentType.StringSelect,
              options
            })
          ]
        });
        const reportMessage = {
          content: `<@${member.id}>, it looks like you have open report(s). If you would like to be added to the support thread, find your report here!`,
          components: [row]
        };
        await report_chan.send(reportMessage);
      }
    } else {
      //HANDLE MEMBERS JOINING GUILDS
      const guildSettings = prisma.guilds;
      const settings = await guildSettings.findFirst({
        where: { id: member.guild.id }
      });
      if (settings && settings.channels) {
        const { moderatorChan, rulesChan } = settings.channels;
        if (!moderatorChan || !rulesChan) return;
        const modChannel = member.guild.channels.cache.get(moderatorChan) as TextChannel;
        const rulesChannel = member.guild.channels.cache.get(rulesChan) as TextChannel;
        const verifyEmbed = new EmbedBuilder({
          author: {
            name: member.displayName,
            icon_url: member.displayAvatarURL(),
            url: `https://discord.com/users/${member.id}`
          },
          title: 'A new user has joined the server!',
          description:
            "Use the buttons below to control the members' verification process or let them verify on their own.",
          fields: [
            {
              name: 'Verification:',
              value: ''
            }
          ]
        });
        const verifyButtons = new ActionRowBuilder<ButtonBuilder>({
          components: ['✅|Bypass-Verify', '👢|Kick', '💥|Ban'].map(choice => {
            const [emoji, label] = choice.split('|');
            const name = label.toLowerCase();
            let style: ButtonStyle;
            switch (name) {
              case 'ban':
                style = ButtonStyle['Danger'];
              case 'bypass-verify':
                style = ButtonStyle['Success'];
              case 'kick':
                style = ButtonStyle['Primary'];
              default:
                style = ButtonStyle['Secondary'];
                break;
            }
            return new ButtonBuilder({
              custom_id: `member_${name}`,
              emoji,
              label: label.includes('-') ? label.split('-')[0] : label,
              style
            });
          })
        });
        if (modChannel) {
          await modChannel.send({
            embeds: [verifyEmbed],
            components: [verifyButtons]
          });
        }
        // 	const { welcomeChan } = settings.channels;
        // 	if (welcomeChan) {
        // 		const welcomeChannel = member.guild.channels.cache.get(
        // 			welcomeChan
        // 		) as TextChannel;
        // 		if (welcomeChannel) {
        //       //welcome embed
        //       const embed = new EmbedBuilder()
        //       //wave button
        //       const waveButton = new ActionRowBuilder<ButtonBuilder>({
        //         components: [
        //           new ButtonBuilder({
        //             custom_id: 'wave-button',
        //             emoji: '',
        //             label: 'Wave to say hi',
        //             style: ButtonStyle.Primary
        //           })
        //         ]
        //       });
        //       //send welcome embed and button

        // 		}
        // 	}
      }
    }
  }
});
