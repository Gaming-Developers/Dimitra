import { google } from "googleapis";
import credentials from "../../../../files/credentials.json" assert { type: "json" };
import {
  ActionRow,
  ActionRowBuilder,
  APISelectMenuOption,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
  MessageActionRowComponent,
  RestOrArray,
  StringSelectMenuBuilder,
  SelectMenuComponentOptionData,
  StringSelectMenuOptionBuilder,
  APIStringSelectComponent,
  TextChannel,
} from "discord.js";
import { Service } from "@sern/handler";
type Questions = { id: string; question: string }[];

async function getFormResponses(channel: TextChannel): Promise<EmbedBuilder[]> {
  const prisma = Service("prisma");

  const pages: EmbedBuilder[] = [];

  const main = new EmbedBuilder({
    author: { name: "New USBP Application Submitted" },
    description: `A new application has been submitted!
    Use the buttons below to view the users responses!
    When you get to the end, you will be able to accept or decline.`,
    footer: {
      text: "SASRP | USBP Applications",
    },
    thumbnail: { url: "https://miami-rp.net/images/SASRP.webp" },
    image: { url: "https://miami-rp.net/images/SASRP-banner.gif" },
    timestamp: Date.now(),
  });
  const authClient = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/forms.responses.readonly"],
    undefined,
    credentials.private_key_id
  );
  const token = await authClient.authorize();
  authClient.setCredentials(token);

  const service = google.forms({ version: "v1", auth: authClient });
  const res = await service.forms.responses.list({
    auth: authClient,
    formId: "1u3EXWtRCxh2_TkwuoH0_Fo2nBdqa_LbLIDRO_Fpy4Zo",
  });

  const questionsById: Questions = [
    {
      id: "1b22abdb",
      question: "What is your Discord name?",
    },
    {
      id: "1a9882fc",
      question: "What is your Discord id?",
    },
    {
      id: "7620e8c5",
      question: "What is your Time Zone?",
    },
    {
      id: "11b12ffb",
      question: "What is your RP-Name",
    },
    {
      id: "294caa43",
      question: "Do you have any past experience in Leo Roleplay?",
    },
    {
      id: "5e476db0",
      question: "Are you familiar with your 10-Codes?",
    },
    {
      id: "301cc574",
      question: "Why should we accept you over other applicants? (75 words)",
    },
    {
      id: "7f3e168a",
      question: "What can you bring to the USBP?",
    },
    {
      id: "58391b1c",
      question: "Do you have anything else you would like to tell us?",
    },
    {
      id: "47c4f83f",
      question:
        "Do you understand that asking about your application before 24 hours could lead to it being denied?",
    },
  ];

  function createResponseEmbed(response: any, questions: Questions) {
    const firstEmbed = new EmbedBuilder({
      fields: questions
        .filter((_, index) => index !== 6 && index !== 7 && index !== 8)
        .map((question) => {
          const answer = response.answers[question.id];
          const answerValue =
            answer &&
            answer.textAnswers &&
            answer.textAnswers.answers.length > 0
              ? answer.textAnswers.answers[0].value
              : "This question did not receive an answer!";
          return { name: question.question, value: answerValue as string };
        }),
      thumbnail: { url: "https://miami-rp.net/images/SASRP.webp " },
    });

    const buildEmbed = (index: number) => {
      const q = questions[index];
      const a = response.answers[q.id];
      return new EmbedBuilder({
        description: `${q.question}\n${
          a && a.textAnswers && a.textAnswers.answers.length > 0
            ? a.textAnswers.answers[0].value
            : "This question did not receive an answer!"
        }`,
        thumbnail: { url: "https://miami-rp.net/images/SASRP.webp" },
      });
    };
    const [secondEmbed, thirdEmbed, fourthEmbed] = [
      buildEmbed(6),
      buildEmbed(7),
      buildEmbed(8),
    ];

    return { firstEmbed, secondEmbed, thirdEmbed, fourthEmbed };
  }

  const responses = res.data.responses || [];
  if (channel) {
    for (const response of responses) {
      const docs = await prisma.reponses.findMany({});
      if (docs.length > 0) {
        const doc = docs[0];
        if (doc.responses.some((r) => r.responseId === response.responseId)) {
          continue;
        } else {
          await prisma.reponses.update({
            where: {
              id: doc.id,
            },
            data: {
              responses: {
                push: {
                  responseId: response.responseId!,
                },
              },
            },
          });
        }
      } else {
        await prisma.reponses.create({
          data: {
            responses: {
              set: {
                responseId: response.responseId!,
              },
            },
          },
        });
      }
      const { firstEmbed, secondEmbed, thirdEmbed, fourthEmbed } =
        createResponseEmbed(response, questionsById);
      pages.push(main, firstEmbed, secondEmbed, thirdEmbed, fourthEmbed);
    }
  }
  return pages;
}

class Paginator {
  private currentCount: number = 0;
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

    const embeds = this.options.embeds ?? this.buildEmbeds()!;

    const rows = [this.buildButtons()];

    const message = await this.handleMessage(embeds, rows);

    return this.handleCollector(message);
  }

  private async handleMessage(
    embeds: EmbedBuilder[],
    rows: (
      | ActionRowBuilder<StringSelectMenuBuilder>
      | ActionRowBuilder<ButtonBuilder>
    )[]
  ) {
    const msg = await this.options.channel?.send({
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
        console.log("colector stopped!");
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

/**
 *
 * @param time Number of minutes to wait between fetching.
 */
export const fetchNewForms = async (time: number) => {
  time = time * 1000 * 60;
  setInterval(async () => {
    const channel = Service("@sern/client").channels.cache.get(
      "1230575538813276160"
    ) as TextChannel;
    const embeds = await getFormResponses(channel);
    if (!embeds || embeds.length < 2) return;
    await new Paginator({
      channel,
      embeds,
      ephemeral: false,
    }).run();
  }, 2000);
};
