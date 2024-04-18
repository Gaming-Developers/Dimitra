//@ts-nocheck
/**
 * @plugin
 * This is OwnerOnly plugin, it allows only bot owners to run the command, like eval.
 *
 * @author @Peter-MJ-Parker [<@371759410009341952>]
 * @version 2.0
 * @example
 * ```ts
 * import { ownerOnly } from "#sern-ext";
 * import { commandModule } from "@sern/handler";
 * export default commandModule({
 *  plugins: [ ownerOnly({ ...options }) ], // can also pass array of IDs to override default owner IDs and custom fail message
 *  execute: (ctx) => {
 * 		//your code here
 *  }
 * })
 * ```
 * @end
 */

import { CommandType, CommandControlPlugin, controller } from "@sern/handler";
import { env } from "#sern/ext";

export function ownerOnly(options: { owners?: string[]; failMsg?: string }) {
	return CommandControlPlugin<CommandType.Both>(async (ctx) => {
		let { failMsg, owners } = options;
		const config = env.OWNER_IDS;
		if (!owners) {
			if (!config || config.length < 1) {
				return controller.stop(); //! Important: It stops the execution of command!
			} else owners = config;
		}
		if (owners && owners.includes(ctx.user.id)) {
			return controller.next();
		}
		await ctx.reply(
			`${failMsg}` ?? "Only bot owners can use this feature!!!"
		);
		return controller.stop(); //! Important: It stops the execution of command!
	});
}
