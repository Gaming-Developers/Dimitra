import { google } from "googleapis";
import credentials from "../../../../files/credentials.json" assert { type: "json" };
import { EmbedBuilder, TextChannel } from "discord.js";
import { Service } from "@sern/handler";
import { Paginator } from "./GooglePaginator.js";
type Questions = { id: string; question: string }[];

async function getFormResponses(
  channel: TextChannel,
  formId?: string
): Promise<EmbedBuilder[]> {
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

  if (!formId) formId = "1u3EXWtRCxh2_TkwuoH0_Fo2nBdqa_LbLIDRO_Fpy4Zo"; //USBP Application Form

  const service = google.forms({ version: "v1", auth: authClient });
  const res = await service.forms.responses.list({
    auth: authClient,
    formId,
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

  const { data } = res;
  const responses = data.responses ?? [];

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
          return {
            name: `**${question.question}**`,
            value: answerValue as string,
          };
        }),
      thumbnail: { url: "https://miami-rp.net/images/SASRP.webp " },
    });

    const buildEmbed = (index: number) => {
      const q = questions[index];
      const a = response.answers[q.id];
      return new EmbedBuilder({
        description: `**${q.question}**\n\n${
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

  if (channel) {
    for (const response of responses) {
      if (response) {
        const doc = await prisma.forms.findFirst({
          where: {
            googleFormId: formId,
          },
        });
        const { answers, createTime, lastSubmittedTime, responseId } = response;

        const modifiedAnswers = Object.values(answers!).map((answer: any) => {
          const question = questionsById.find(
            (q) => q.id === answer.questionId
          );
          const questionText = question
            ? question.question
            : "Unknown Question";
          return {
            question: questionText,
            questionId: answer.questionId,
            answer: answer.textAnswers?.answers![0].value,
          };
        });

        const answersArray = questionsById.map((question) => {
          const foundAnswer = modifiedAnswers.find(
            (answer) => answer.questionId === question.id
          );
          return (
            foundAnswer || { question: question.question, value: "No answer" }
          );
        });

        if (doc) {
          const _res = doc?.responses.find((d) => d.id === responseId);
          if (_res) {
            continue;
          } else {
            await prisma.forms.update({
              where: {
                id: doc.id,
              },
              data: {
                responses: {
                  push: {
                    createTime: createTime!,
                    id: responseId!,
                    lastSubmittedTime: lastSubmittedTime!,
                    answers: answersArray,
                  },
                },
              },
            });
          }
        } else {
          await prisma.forms.create({
            data: {
              googleFormId: formId,
              responses: {
                createTime: createTime!,
                lastSubmittedTime: lastSubmittedTime!,
                id: responseId!,
                answers: answersArray,
              },
            },
          });
        }
        const { firstEmbed, secondEmbed, thirdEmbed, fourthEmbed } =
          createResponseEmbed(response, questionsById);
        pages.push(main, firstEmbed, secondEmbed, thirdEmbed, fourthEmbed);
      }
    }
  }
  return pages;
}

export const fetchNewForms = async () => {
  setInterval(
    async () => {
      const channel = Service("@sern/client").channels.cache.get(
        "1230575538813276160"
      ) as TextChannel;
      const embeds = await getFormResponses(channel);
      if (!embeds || embeds.length < 2) return;
      await new Paginator({
        channel,
        content:
          "<@&1231658494139174912>, someone just filled out a new application!",
        embeds,
        ephemeral: false,
      }).run();
    },
    10 * 1000 * 60
  );
};
