/**
 * @plugin
 * @author @Peter-MJ-Parker [<@371759410009341952>]
 * @version 1.0.0
 * @example
 * ```ts
 * export default commandModule({
 *     type: CommandType.Slash, //plugin can be used with any command type
 *     plugins: [cooldown({ cooldownType: CooldownTypes.global, duration: 300 })],
 *     execute: ctx => {
 *         ctx.reply("");
 *     }
 * })
 * ```
 * @end
 */

import { InternalCooldownConfig, env } from '#sern/ext';
import { CommandType, controller, CommandControlPlugin, Services } from '@sern/handler';
import {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ComponentType,
  ContextMenuCommandInteraction,
  UserContextMenuCommandInteraction
} from 'discord.js';

export function cooldown(
  commandType: CommandType,
  usage: Omit<InternalCooldownConfig, 'userId' | 'actionId' | 'guildId' | 'channelId'>
) {
  async function get(
    interaction:
      | ChatInputCommandInteraction
      | ButtonInteraction
      | AnySelectMenuInteraction
      | ContextMenuCommandInteraction
      | UserContextMenuCommandInteraction
  ) {
    const [client, cooldowns] = Services('@sern/client', 'cooldowns');

    let actionId = '';
    if (
      interaction instanceof ChatInputCommandInteraction ||
      interaction instanceof ContextMenuCommandInteraction ||
      interaction instanceof UserContextMenuCommandInteraction
    ) {
      actionId = `command_${interaction.commandName}`;
    } else {
      switch (interaction.componentType) {
        case ComponentType.Button:
          actionId = `button_${interaction.customId}`;
          break;
        case ComponentType.StringSelect ||
          ComponentType.ChannelSelect ||
          ComponentType.MentionableSelect ||
          ComponentType.RoleSelect ||
          ComponentType.UserSelect:
          actionId = `menu_${interaction.customId}`;
          break;
        default:
          console.log(interaction.type);
          actionId = 'unknown';
          break;
      }
    }
    const cooldownUsage: InternalCooldownConfig = {
      cooldownType: usage.cooldownType,
      duration: usage.duration,
      userId: interaction.user.id,
      actionId,
      guildId: interaction.guildId!,
      channelId: interaction.channelId
    };
    const result = await cooldowns.start(cooldownUsage);
    if (typeof result === 'object') {
      await client.users.cache.get(env.OWNER_ID)?.send({
        content: 'There was an error implementing cooldowns! ' + result.main
      });
      await interaction.reply({
        content: result.reply,
        ephemeral: true
      });
      return controller.stop();
    }
    if (typeof result === 'string') {
      await interaction.reply({
        content: result,
        ephemeral: true
      });
      return controller.stop();
    }

    return controller.next();
  }
  if (commandType === CommandType.Slash) {
    return CommandControlPlugin<CommandType.Slash>(async ({ interaction }) => {
      return await get(interaction);
    });
  }
  if (commandType === CommandType.Button) {
    return CommandControlPlugin<CommandType.Button>(async interaction => {
      return await get(interaction);
    });
  }
  if (commandType === CommandType.MentionableSelect) {
    return CommandControlPlugin<CommandType.MentionableSelect>(async interaction => {
      return await get(interaction);
    });
  }
  if (commandType === CommandType.StringSelect) {
    return CommandControlPlugin<CommandType.StringSelect>(async interaction => {
      return await get(interaction);
    });
  }
  if (commandType === CommandType.RoleSelect) {
    return CommandControlPlugin<CommandType.RoleSelect>(async interaction => {
      return await get(interaction);
    });
  }
  if (commandType === CommandType.UserSelect) {
    return CommandControlPlugin<CommandType.UserSelect>(async interaction => {
      return await get(interaction);
    });
  }
  if (commandType === CommandType.ChannelSelect) {
    return CommandControlPlugin<CommandType.ChannelSelect>(async interaction => {
      return await get(interaction);
    });
  }
  if (commandType === CommandType.CtxMsg) {
    return CommandControlPlugin<CommandType.CtxMsg>(async interaction => {
      return await get(interaction);
    });
  } else {
    return CommandControlPlugin<CommandType.CtxUser>(async interaction => {
      return await get(interaction);
    });
  }
}
