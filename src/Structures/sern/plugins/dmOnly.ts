/**
 * @plugin
 * This is dmOnly plugin, it allows commands to be run only in DMs.
 *
 * @author @EvolutionX-10 [<@697795666373640213>]
 * @version 1.0.0
 * @example
 * ```ts
 * import { dmOnly } from "../plugins/dmOnly";
 * import { commandModule } from "@sern/handler";
 * export default commandModule({
 *  plugins: [dmOnly()],
 *  execute: (ctx) => {
 * 		//your code here
 *  }
 * })
 * ```
 * @end
 */
import { CommandControlPlugin, CommandType, controller } from '@sern/handler';
export function dmOnly(content?: string, ephemeral?: boolean) {
  //  For discord.js you should have the Partials.Channel and DirectMessages intent enabled.
  return CommandControlPlugin<CommandType.Both>(async ctx => {
    if (ctx.channel?.isDMBased()) return controller.next();

    if (content) await ctx.reply({ content, flags: ephemeral ? 64 : undefined }); // Change this if you want or remove it for silent deny
    return controller.stop();
  });
}
