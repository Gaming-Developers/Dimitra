import { Sern, makeDependencies } from "@sern/handler";
import { Dimitra } from "#bot";
import { Sparky } from "#sern/ext";
import { Prisma } from "#adapters/Prisma";
import Cooldowns from "#adapters/Cooldowns";

await makeDependencies(({ add, swap }) => {
	const logger = new Sparky("debug", "highlight");
	const prisma = new Prisma(logger);
	const cooldown = new Cooldowns(prisma);
	const client = new Dimitra(cooldown);
	swap("@sern/logger", () => logger);
	add("prisma", () => prisma);
	add("cooldowns", () => cooldown);
	add("@sern/client", () => client);
});

Sern.init("file");
