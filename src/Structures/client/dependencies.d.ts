import { CoreDependencies, Singleton } from "@sern/handler";
import { Dimitra } from "#bot";
import { Sparky } from "#sern/ext";
import { PrismaClient } from "@prisma/client";
import Cooldowns from "#adapters/Cooldowns";

declare global {
	interface Dependencies extends CoreDependencies {
		"@sern/logger": Singleton<Sparky>;
		prisma: Singleton<PrismaClient>;
		cooldowns: Singleton<Cooldowns>;
		"@sern/client": Singleton<Dimitra>;
	}
	interface ValidPublishOptions {
		guildIds?: NonEmptyArray<`${number}`> | undefined;
		dmPermission?: boolean | undefined;
		defaultMemberPermissions?: NonEmptyArray<bigint> | null;
	}
	type NonEmptyArray<T> = [T, ...T[]];
	interface CMDProps {
		category: string;
		examples?: string;
	}
}

export {};
