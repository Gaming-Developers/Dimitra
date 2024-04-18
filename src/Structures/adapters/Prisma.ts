import { PrismaClient } from "@prisma/client";
import { Sparky } from "#sern/ext";

export class Prisma extends PrismaClient {
	constructor(private logger: Sparky) {
		super();
		this.connect();
	}

	private async connect() {
		this.logger.info("[PRISMA]- Connecting to Database...");
		await this.$connect().then(() =>
			this.logger.success("[PRISMA]- Connected to Database!")
		);
	}
}
