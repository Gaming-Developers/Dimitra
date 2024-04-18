/******************LOGGING******************/
export { Sparky } from "./handler-ext/logging.js";
/*******************************************/

/******************PLUGINS******************/
export * from "./plugins/assertFields.js";
export * from "./plugins/buttonConfirmation.js";
export * from "./plugins/channelType.js";
export * from "./plugins/confirmation.js";
export * from "./plugins/cooldown.js";
export * from "./plugins/disable.js";
export * from "./plugins/dmOnly.js";
export * from "./plugins/ownerOnly.js";
export * from "./plugins/permCheck.js";
export * from "./plugins/requirePermission.js";
export * from "./plugins/serverOnly.js";
/*******************************************/

/******************LOADER*******************/
export { env } from "./handler-ext/load.js";
/*******************************************/

/******************TYPES********************/
export interface InternalCooldownConfig {
	cooldownType: CooldownTypes;
	duration: number | [number, "s" | "m" | "d" | "h"];
	userId: string;
	actionId: string;
	guildId?: string;
	channelId?: string;
}

export enum CooldownTypes {
	perUser = "perUser",
	perUserPerGuild = "perUserPerGuild",
	perGuild = "perGuild",
	global = "global",
	perChannel = "perChannel",
	perUserPerChannel = "perUserPerChannel"
}

export const cooldownDurations = {
	s: 1,
	m: 60,
	h: 60 * 60,
	d: 60 * 60 * 24
};
/*******************************************/
