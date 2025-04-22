import { Cooldowns, env } from '#sern/ext';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

export class Dimitra extends Client {
  constructor(private cooldowns: Cooldowns) {
    super({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildModeration
      ],
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User
      ],
      allowedMentions: {
        repliedUser: false,
        roles: ['1231658494139174912']
      },
      shards: 'auto'
    });
    this.login(env.DISCORD_TOKEN);
  }
}
