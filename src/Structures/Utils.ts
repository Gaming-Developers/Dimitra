import {
  ActionRowBuilder,
  BaseInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Guild,
  GuildMember,
  InteractionResponse,
  Message,
  Role,
  Snowflake,
  SnowflakeUtil,
  StringSelectMenuBuilder,
  TextChannel,
  User
} from 'discord.js';
import { CommandModule, Service, Services } from '@sern/handler';

export * as FileGetters from './adapters/FileGetters.js';

export const NewRankNotifier = (role: Role, member: GuildMember) => {
  const memberHighestRole = member.roles.highest;

  let title = '';

  if (role.position > memberHighestRole.position) {
    title = 'Congrats on your promotion!';
  } else {
    title = `Unfortunately, you have been demoted to .`;
  }

  return new EmbedBuilder({ title });
};

export const createButtons = (customId: string) => {
  return [
    new ActionRowBuilder<ButtonBuilder>({
      components: ['✔️|Yes', '✖️|No'].map(choice => {
        const [emoji, label] = choice.split('|');
        return new ButtonBuilder({
          custom_id: `${customId}_${label.toLowerCase()}`,
          emoji,
          label,
          style: label === 'Yes' ? ButtonStyle.Danger : ButtonStyle.Success
        });
      })
    })
  ];
};

export async function delay(time: number) {
  const { setTimeout } = await import('node:timers/promises');
  return await setTimeout(time * 1000);
}

export function getId(mention: string): Snowflake | void {
  let id = '';
  if (mention.includes('@') && !mention.includes('&')) {
    id += mention.replaceAll(/[<@>]/g, '');
  }
  if (mention.includes('#')) {
    id += mention.replaceAll(/[<#>]/g, '');
  }
  if (mention.includes('@&')) {
    id += mention.replaceAll(/[<@&>]/g, '');
  }
  console.log(id);
  console.log(isValidSnowflake(id));
  return isValidSnowflake(id) ? id : console.error(`**${id}** is not a valid snowflake.`);
}

export function capitalise(text: string, capEachWord: boolean = false): string {
  if (capEachWord === true) {
    return text
      .split(' ')
      .map(str => str.slice(0, 1).toUpperCase() + str.slice(1))
      .join(' ');
  } else {
    return text.slice(0, 1).toUpperCase() + text.slice(1);
  }
}

export async function channelUpdater(guild: Guild) {
  const [client, prisma] = Services('@sern/client', 'prisma');
  if (!client) return console.error('No client provided!');
  if (!client.guilds.cache.has(guild.id)) return console.error('Guild not found in my cache!');
  const db = await prisma.guilds.findFirst({
    where: { id: guild.id }
  });
  if (!db) {
    return console.error('No database entry! Please re-add me to the specified guild to create the entry.');
  } else {
    if (db.channels) {
      const chans = db.channels!;
      const channelIds = [chans?.allCountChan, chans?.botCountChan, chans?.userCountChan];
      if (!chans || !channelIds) return;
      for (const chanId of channelIds) {
        if (chanId) {
          const result = await guild.channels.fetch(chanId);
          if (!result) {
            return console.error(
              `${chanId} does not exist in guild [${guild.name} - ${guild.id}]. Please check channel id's in database and try again!`
            );
          }
        } else
          return console.error(
            `${chanId} does not exist in database. Please check channel id's in database and try again!`
          );
      }

      const counts = {
        total: Number(guild.memberCount),
        users: Number(guild.members.cache.filter(m => !m.user.bot).size),
        bots: Number(guild.members.cache.filter(m => m.user.bot).size)
      } as { [key: string]: number };

      const total = guild?.channels.cache.get(chans?.allCountChan!);
      const users = guild?.channels.cache.get(chans?.userCountChan!);
      const bots = guild?.channels.cache.get(chans?.botCountChan!);

      const amounts = {
        total: Number(total?.name.split(': ')[1]),
        users: Number(users?.name.split(': ')[1]),
        bots: Number(bots?.name.split(': ')[1])
      } as { [key: string]: number };

      try {
        for (const key in counts) {
          const countsValue = counts[key];
          const amountsValue = Number(amounts[key]);

          if (countsValue !== amountsValue) {
            await prisma.guilds
              .update({
                where: { id: guild.id },
                data: {
                  channels: { set: { [key]: countsValue } }
                }
              })
              .then(async () => {
                switch (key) {
                  case 'total':
                    await total?.setName(`Total Members: ${countsValue.toLocaleString()}`);
                    break;
                  case 'users':
                    await users?.setName(`Users: ${countsValue.toLocaleString()}`);
                    break;
                  case 'bots':
                    await bots?.setName(`Bots: ${countsValue.toLocaleString()}`);
                    break;
                }
              });
          }
        }
      } catch (err) {
        return console.error(err);
      }
    }
  }
}

export function isValidSnowflake(id: Snowflake) {
  // Discord Epoch (January 1, 2015) 1420070400000
  const deconstructed = SnowflakeUtil.deconstruct(id);
  return deconstructed.timestamp >= 1420070400000 ? true : false;
}

export async function deleteOnTimeout(messages: Message | Message[] | InteractionResponse<boolean>, time: number) {
  try {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });

    const deleteMessage = async (message: Message) => {
      if (message.deletable) {
        await message.delete();
      } else {
        console.log(`Unable to delete message with ID: ${message.id}`);
      }
    };

    if (messages instanceof Message) {
      await deleteMessage(messages);
    } else if (Array.isArray(messages)) {
      for (const message of messages) {
        await deleteMessage(message);
      }
    } else {
      console.log('Invalid message(s) provided.');
    }
  } catch (err) {
    console.error(err);
  }
}

type Range =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25;

export async function guildPaginatedEmbed(
  message: Message<true> | BaseInteraction,
  itemsPerPage: Range,
  user: User
): Promise<Guild | undefined> {
  const client = Service('@sern/client');
  return new Promise(async (resolve, reject) => {
    if (!message.channel?.isTextBased()) return;
    const guilds = Array.from(client.guilds.cache.values());
    let userGuilds = guilds;

    if (user) {
      const memberGuilds = guilds.filter(guild => {
        const member = guild.members.cache.get(user.id);
        return member !== undefined;
      });
      userGuilds = memberGuilds;
    }

    const pages: EmbedBuilder[] = [];
    for (let i = 0; i < userGuilds.length; i += itemsPerPage) {
      const chunk = userGuilds.slice(i, i + itemsPerPage);
      const embed = new EmbedBuilder({
        title: 'Guild Selector.',
        fields: chunk.map(g => {
          return { name: `Name: ${g.name}`, value: `ID: ${g.id}` };
        }),
        footer: {
          text: 'Click stop when you find your guild.'
        }
      });

      pages.push(embed);
    }
    let currentPage = 0;
    const currentGuilds = guilds.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    const menu = new ActionRowBuilder<StringSelectMenuBuilder>({
      components: [
        new StringSelectMenuBuilder({
          custom_id: 'select-guild',
          options: currentGuilds.map(guild => ({
            label: guild.name,
            value: 'guild-' + guild.id,
            emoji: guild.iconURL() ?? '🤖',
            description: guild.description ?? ''
          })),
          max_values: 1,
          placeholder: 'Select a Guild'
        })
      ]
    });
    const send = async () => {
      const msg = await (message.channel as TextChannel).send({
        embeds: [pages[currentPage]],
        components: [menu]
      })!;
      const guild = await menuCol(msg);
      if (guild) {
        return resolve(guild);
      }
    };
    if (pages.length === 1) {
      await send();
    } else {
      const row = new ActionRowBuilder<ButtonBuilder>({
        components: [
          '⏮️|paginate-back',
          '⏹️|paginate-stop',
          '⏩|paginate-next',
          '🏠|paginate-home',
          '🏁|paginate-last'
        ].map(choice => {
          const [emoji, name] = choice.split('|');
          const caps = capitalise(name.split('-')[1]);
          let style: ButtonStyle;
          switch (caps) {
            case 'Stop':
              style = ButtonStyle.Success;
              break;
            case 'Home':
              style = ButtonStyle.Danger;
              break;
            case 'Last':
              style = ButtonStyle.Secondary;
              break;
            default:
              style = ButtonStyle.Primary;
              break;
          }
          return new ButtonBuilder({
            custom_id: name,
            label: caps,
            emoji,
            style
          });
        })
      });
      const msg = await (message.channel as TextChannel).send({
        embeds: [pages[currentPage]],
        components: [row]
      });

      const filter = (interaction: ButtonInteraction) =>
        ['paginate-back', 'paginate-next', 'paginate-stop', 'paginate-home', 'paginate-last'].includes(
          interaction.customId
        ) && interaction.user.id === (message instanceof Message ? message.author.id : message.user.id);
      const collector = msg.createMessageComponentCollector({
        filter,
        time: 60000,
        componentType: ComponentType.Button
      });

      collector.on('collect', async interaction => {
        switch (interaction.customId) {
          case 'paginate-back':
            if (currentPage !== 0) {
              currentPage -= 1;
              await interaction.update({
                embeds: [pages[currentPage]]
              });
              collector.resetTimer();
            }
            break;

          case 'paginate-forward':
            if (currentPage < pages.length - 1) {
              currentPage += 1;
              await interaction.update({
                embeds: [pages[currentPage]]
              });
              collector.resetTimer();
            }
            break;
          case 'paginate-home':
            await interaction.update({ embeds: [pages[0]] });
            collector.resetTimer();
            break;
          case 'paginate-last':
            await interaction.update({
              embeds: [pages[pages.length - 1]]
            });
            collector.resetTimer();
            break;
          case 'paginate-stop':
            collector.stop('found');
            const msg = await interaction.update({
              components: [menu]
            });
            const guild = await menuCol(msg);
            guild ? resolve(guild) : reject(undefined);
            break;
        }
      });

      collector.on('ignore', async i => {
        await i.reply({
          ephemeral: true,
          content: 'Go away ignoramous.'
        });
      });

      collector.on('end', async (_, reason) => {
        if (reason === 'found') return;
        if (reason === 'time' && msg) {
          resolve(undefined);
          let edited = await msg.edit({ components: [] });
          let sent = await msg.channel.send('You failed to respond in time.');
          await deleteOnTimeout([edited, sent], 5000);
        }
      });
    }

    async function menuCol(msg: Message<boolean> | InteractionResponse): Promise<Guild | undefined> {
      return new Promise(async (resolve, reject) => {
        const collector = msg.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          max: 1,
          time: 10000,
          filter: interaction => interaction.isStringSelectMenu() && interaction.customId.startsWith('guild-')
        });
        collector.on('collect', async i => {
          await i.deferUpdate();
          const [selected] = i.values;
          const guild =
            msg.client.guilds.cache.get(selected.split('-')[1]) ??
            (await msg.client.guilds.fetch(selected.split('-')[1]));
          if (guild) {
            resolve(guild);
            collector.stop('found-guild');
          }
        });
        collector.on('ignore', async i => {
          await i.reply({
            ephemeral: true,
            content: 'Go away ignoramous!'
          });
        });
        collector.on('end', async (_, reason) => {
          if (reason === 'time') {
            resolve(undefined);
          }
          if (reason === 'found-guild') {
          }
        });
      });
    }
  });
}

export function isGuildMember(user: User) {
  const client = Service('@sern/client');
  const isUser = client.users.cache.get(user.id);
  if (!isUser) return false;
  const guilds = Array.from(client.guilds.cache.values());

  return guilds.some(guild => guild.members.cache.has(isUser.id));
}

function formatMessage(message: Message): string {
  let content = message.content;

  // Escape special characters for HTML
  content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Handle codeblocks
  if (message.content.startsWith('```')) {
    const codeblock = content.slice(3, content.indexOf('```', 3));
    content = `<pre><code>${codeblock}</code></pre>`;
  }

  // Handle user mentions
  content = content.replace(/<@!?(\d+)>/, (match, userId) => {
    return `<a href="https://discord.com/users/${userId}">@${message.guild?.members.cache.get(userId)?.displayName || userId}</a>`;
  });

  // Handle attachments (basic placeholder for now)
  if (message.attachments.size > 0) {
    content += '<p>Attachments found (not displayed in this format)</p>';
  }

  // Handle embeds (basic placeholder for now)
  if (message.embeds) {
    for (const embed of message.embeds) {
      content += `
      <div class="embed">
        ${embed.title ? `<div class="embed-title">${embed.title}</div>` : ''}
        ${embed.description ? `<div class="embed-description">${embed.description}</div>` : ''}
        ${embed.fields?.map(field => `<div class="embed-field"><span class="embed-field-name">${field.name}</span><span class="embed-field-value">${field.value}</span></div>`).join('') || ''}
      </div>`;
    }
  }

  // Wrap message in a container with author and timestamp
  content += `<div class="message">`;
  content += `<div class="message-header">`;
  content += `<div class="author">`;
  content += `<img src="${message.author.avatarURL({ size: 64 })}" alt="${message.author.username}" class="avatar">`; // Add avatar image
  content += `<span class="username">${message.author.username}</span>`;
  content += `</div>`;
  content += `<span class="timestamp">(${new Date(message.createdAt).toLocaleString()})</span>`;
  content += `</div>`;
  content += `<div class="message-content">${message.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`; // Escape content

  // ... (rest of embed handling remains the same)

  content += `</div>`;
  return content;
}

export async function createTranscript(channelId: string, ticket: string): Promise<string> {
  const channel = (await Service('@sern/client').channels.fetch(channelId)) as TextChannel;

  if (!channel) {
    throw new Error('Invalid channel ID or channel is not a text channel');
  }

  const messages = await channel.messages.fetch({ limit: 100 }); // Fetch a limited number of messages for demonstration

  const htmlContent = messages.map(formatMessage).join('');

  // Wrap all messages in a container
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ticket} Transcript</title>
	<style>
	html {
		background-color: #2c2f33;
		user-select: auto;
		scroll-behavior: smooth;
		overflow-x: hidden;
	}
	body {
		font-family: sans-serif;
		margin: 20px;
	}
	.message {
		margin-bottom: 10px;
		border-bottom: 1px solid #ddd;
		padding-bottom: 10px;
	}
	.author {
		font-weight: bold;
	}
	.timestamp {
		color: #aaa;
		font-size: 0.8em;
	}
	.content {
		margin-top: 5px;
	}
	.embed {
		border: 1px solid #ddd;
		padding: 10px;
		margin-top: 10px;
	}
	.embed-title {
		font-weight: bold;
		margin-bottom: 5px;
	}
	.embed-description {
		margin-bottom: 5px;
	}
	.embed-field {
		display: flex;
		margin-bottom: 5px;
	}
	.embed-field-name {
		font-weight: bold;
		width: 100px;
	}
	.embed-field-value {
		flex: 1;
	}
	.avatar {
		size: 64px;
		border-radius: 50%;
	}
</style>
</head>
<body>
  <h1>${ticket} Transcript</h1>
  ${htmlContent}
</body>
</html>`;

  return html;
}
