import "dotenv/config";
import { initDB } from "./db/sqlite";
import { Bot, Context, GrammyError, HttpError, InputFile } from "grammy";
import {
  Conversation,
  conversations,
  createConversation,
  ReplayEngine,
  type ConversationFlavor,
} from "@grammyjs/conversations";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import { newExtenseConversation } from "./conversations/newExtenseConversation";
import { mainMenu } from "./keyboards/mainMenu";
import { categoriesConversation } from "./conversations/categoriesConversation";

export const MAINIMAGE = new InputFile("src/imgs/main.png");

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("Не удается получить токен");
}
// Внешние объекты контекста (знают все плагины middleware)
export type MyContext = HydrateFlavor<ConversationFlavor<Context>>;
// Внутренние объекты контекста (знают все плагины диалогов)
export type MyConversationContext = HydrateFlavor<Context>;
// Используйте как внешний, так и внутренний тип для вашего диалога.
export type MyConversation = Conversation<MyContext, MyConversationContext>;

const bot = new Bot<MyContext>(BOT_TOKEN);

bot.use(hydrate());
bot.use(conversations());
bot.use(createConversation(newExtenseConversation));
bot.use(createConversation(categoriesConversation));

bot.command("start", async (ctx) => {
  await ctx.replyWithPhoto(MAINIMAGE, {
    caption:
      "Привет, этот бот поможет тебя контролировать твои расходы.\nВоспользуйся кнопками⬇️",
    reply_markup: mainMenu,
  });
});

bot.callbackQuery("new_extense", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("newExtenseConversation");
});

bot.callbackQuery("categories", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("categoriesConversation");
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Ошибка в запросе:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Не удалось связаться с Telegram:", e);
  } else {
    console.error("Неизвестная ошибка:", e);
  }
});

async function startBot() {
  try {
    initDB();
    bot.start();
    console.log("Бот и БД запущены успешно.");
  } catch (error) {
    console.error("Ошибка при запуске бота: ", error);
  }
}

startBot();
