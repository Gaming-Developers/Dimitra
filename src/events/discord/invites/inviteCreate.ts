import { env } from "#sern/ext";
import { discordEvent } from "@sern/handler";
import { ChannelType, Events, Guild, GuildTextBasedChannel } from "discord.js";

export default discordEvent({
  name: Events.InviteCreate,
  async execute(invite) {
    if (invite.channel?.type === ChannelType.GroupDM) {
      return;
    } else {
      const guild = invite.guild! as Guild;
      if (guild.id === "1228509238889021502") {
        const member = (await guild.members.fetch()).get(invite.inviterId!);
        if (guild.vanityURLCode || invite.code !== "HMAnKbVJvX") {
          const link =
            "https://discord.com/channels/1228509238889021502/1228509239731818576/1228512815996997703";
          const opts = {
            content: `${member}
            ${guild.name} already has an official server invite. 
            Please check ${link} for the link! Your invite has been deleted!`,
          };

          const chan = guild.channels.cache.get(
            "1230533173503463527"
          ) as GuildTextBasedChannel;

          if (env.OWNER_IDS.includes(invite.inviterId!)) {
            return true;
          }
          await invite.delete("Only one invite allowed in this server.");
          return await chan.send(opts);
        }
      }
    }
  },
});
