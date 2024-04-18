import {
	CommandType,
	Service,
	type CommandModule,
	CommandModuleDefs,
	ModuleStore,
	CoreModuleStore,
	SernOptionsData,
	ContextMenuUser,
	SlashCommand,
	BothCommand,
	ChannelSelectCommand,
	ContextMenuMsg,
	MentionableSelectCommand,
	ModalSubmitCommand,
	RoleSelectCommand,
	StringSelectCommand,
	UserSelectCommand
} from "@sern/handler";
import { ApplicationCommandOption } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { env } from "#sern/ext";

export const getAllFiles = (path: string, foldersOnly = false) => {
	const files = readdirSync(path, {
		withFileTypes: true
	});
	let filesFound: string[] = [];

	for (const file of files) {
		const fileName = join(path, file.name); //`${path}\\${file.name}`

		if (file.isDirectory()) {
			if (foldersOnly) {
				filesFound.push(fileName);
			} else {
				filesFound = [...filesFound, ...getAllFiles(fileName)];
			}
			continue;
		}

		filesFound.push(fileName);
	}
	return filesFound;
};
type CmdModules = Exclude<
	CommandModule,
	| ContextMenuUser
	| ContextMenuMsg
	| StringSelectCommand
	| MentionableSelectCommand
	| UserSelectCommand
	| ChannelSelectCommand
	| RoleSelectCommand
	| ModalSubmitCommand
>;

export const findCommands = async (id: string) => {
	let commandsFound = [];

	const cmds = getAllFiles("./src/commands");
	for (const cmd of cmds) {
		if (
			cmd
				.split(/[\/\\]/g)
				.pop()
				?.startsWith("!")
		) {
			continue;
		}

		const file = await import(`${process.cwd()}/${cmd}`);

		const module = file.default as CmdModules;
		const cat: string = file.props.category || cmd.split(/[\/\\]/g)[2];
		const ownerCmds = cat === "owner"; //folderName or category = 'owner'
		if (
			(ownerCmds && !env.OWNER_IDS.includes(id)) ||
			!module ||
			module.type === CommandType.Text ||
			module.type === CommandType.Button ||
			!module.execute
		)
			continue;
		const cmdName = cmd.split("/").pop()?.split(".")[0]!;

		const cmdProps = {
			name: cmdName,
			description:
				(module.description as string) ?? ("No description!" as string),
			category: cat ?? "No category specified!",
			examples: "> " + file.props.examples?.split(",")?.join("\n> "),
			options:
				(module.options as SernOptionsData[]) ??
				([] as SernOptionsData[])
		};
		commandsFound.push(cmdProps);
	}
	return commandsFound;
};
export const findCategories = (id: string) => {
	const folders = getAllFiles("./src/commands", true);
	let categories: string[] = [];

	function isDirectoryEmpty(directoryPath: string) {
		try {
			const files = readdirSync(directoryPath);
			return files.length === 0;
		} catch (error) {
			Service("@sern/logger").error(
				`FileGetters encountered an error while finding "categories" - Error reading directory: ${error}`
			);
			return false;
		}
	}

	for (const folderPath of folders) {
		const cmdFolder = folderPath.split(/[\/\\]/g).pop()!;
		if (
			cmdFolder.startsWith("!") ||
			(cmdFolder === "owner" && !env.OWNER_IDS.includes(id)) ||
			isDirectoryEmpty(folderPath) ||
			cmdFolder === "components"
		)
			continue;
		categories.push(cmdFolder);
	}
	return categories;
};
