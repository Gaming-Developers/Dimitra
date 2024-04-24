import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";

export class Paginator {
  private currentCount: number = 0;
  private content: string = "";
  private descriptions?: string[];

  public get pages() {
    return (this.options.embeds?.length ?? this.descriptions?.length)!;
  }

  public constructor(private readonly options: PaginatorOptions = {}) {
    this.options.emojis ??= ["⏮", "◀", "⏹", "▶", "⏭"];
    this.options.embeds &&= this.options.embeds.map((embed, i) =>
      new EmbedBuilder(embed.data).setFooter({
        text: `Page ${i + 1}/${this.options.embeds!.length}`,
      })
    );
  }

  public setContent(content: string): this {
    this.options.content = content;
    return this;
  }

  public setEmbeds(embeds: EmbedBuilder[]): this {
    this.options.embeds = embeds;
    return this;
  }

  public setDescriptions(descriptions: string[]): this {
    this.descriptions = descriptions;
    return this;
  }

  public setCurrentCount(count: number): this {
    this.currentCount = --count;
    return this;
  }

  public async run() {
    this.sanityChecks();

    const content = this.options.content ?? "";

    const embeds = this.options.embeds ?? this.buildEmbeds()!;

    const rows = [this.buildButtons()];

    const message = await this.handleMessage(embeds, rows, content);

    return this.handleCollector(message);
  }

  private async handleMessage(
    embeds: EmbedBuilder[],
    rows: (
      | ActionRowBuilder<StringSelectMenuBuilder>
      | ActionRowBuilder<ButtonBuilder>
    )[],
    content?: string
  ) {
    const msg = await this.options.channel?.send({
      content: content!,
      embeds: [embeds![this.currentCount]],
      components: rows,
    })!;
    return msg;
  }

  private handleCollector(message: Message) {
    const embeds = this.options.embeds ?? this.buildEmbeds()!;
    const collector = message.createMessageComponentCollector({
      time: this.options.time ?? 6_00_000,
    });

    collector.on("collect", async (i) => {
      collector.resetTimer();

      switch (i.customId as ButtonIds) {
        case "#paginator/first":
          this.currentCount = 0;
          break;
        case "#paginator/back":
          this.currentCount--;
          break;
        case "#paginator/stop":
          i.message.components = [];
          this.currentCount = this.pages - 4;
          break;
        case "#paginator/forward":
          this.currentCount++;
          break;
        case "#paginator/last":
          this.currentCount = this.pages - 1;
          break;
        default:
          if (!i.isStringSelectMenu()) return;
          this.currentCount = parseInt(i.values[0]);
      }

      if (this.currentCount < 0) this.currentCount = 0;
      if (this.currentCount >= this.pages) this.currentCount = this.pages - 1;

      const row = new ActionRowBuilder<ButtonBuilder>();
      row.addComponents(
        ["✅|Accept", "❌|Decline"].map((choice) => {
          const [emoji, name] = choice.split("|");
          return new ButtonBuilder({
            custom_id: `app_${name.toLowerCase()}`,
            emoji,
            label: name,
            style: ButtonStyle.Primary,
          });
        })
      );
      await i.update({
        embeds: [embeds[this.currentCount]],
        components: i.message.components.length ? [this.buildButtons()] : [row],
      });

      if (
        i.message.components.length === 0 ||
        i.message.components[0].components.length === 2
      ) {
        collector.stop("pagination stopped");
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "pagination stopped") {
        return;
      }
      await message.edit({ components: [] }).catch(() => null);
    });
  }

  private buildButtons() {
    const embeds = (this.options.embeds ?? this.descriptions)!;
    const buttons = [];
    const first = 0;
    const last = this.pages - 1;
    const ids = ["first", "back", "stop", "forward", "last"];
    for (let i = 0; i < 5; i++) {
      const button = new ButtonBuilder()
        .setCustomId(`#paginator/${ids[i]}`)
        .setEmoji(this.options.emojis![i])
        .setDisabled(
          embeds.length === 1 ||
            ((i === 0 || i === 1) && first === this.currentCount) ||
            ((i === 3 || i === 4) && last === this.currentCount)
        )
        .setStyle(ButtonStyle.Secondary);
      buttons.push(button);
    }
    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(buttons);
    return row;
  }

  private buildEmbeds() {
    if (!this.descriptions) return;
    const defaultEmbed = new EmbedBuilder();
    const embeds = Array(this.pages)
      .fill(null)
      .map((_, i) => {
        const embed = new EmbedBuilder(defaultEmbed.data);
        embed.setDescription(this.descriptions![i]);
        !embed.data.color && embed.setColor("Random");
        embed.setFooter({
          text: `Page ${i + 1}/${this.descriptions!.length}`,
        });
        return embed;
      });
    return embeds;
  }

  private sanityChecks() {
    if (!this.options.embeds && !this.descriptions) {
      throw new Error("No embeds or descriptions provided");
    }
    if (this.options.embeds && !this.options.embeds.length) {
      throw new Error("No embeds provided");
    }
    if (this.descriptions && !this.descriptions.length) {
      throw new Error("No descriptions provided");
    }
  }
}

interface PaginatorOptions {
  channel?: TextChannel;
  content?: string;
  time?: number;
  embeds?: EmbedBuilder[];
  emojis?: [string, string, string, string, string];
  ephemeral?: boolean;
}

type ButtonIds =
  | "#paginator/first"
  | "#paginator/back"
  | "#paginator/stop"
  | "#paginator/forward"
  | "#paginator/last";
