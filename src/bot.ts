import "dotenv/config";
import { initDB } from "./db/sqlite";
import { Bot, Context, GrammyError, HttpError } from "grammy";
import {
  Conversation,
  conversations,
  createConversation,
  type ConversationFlavor,
} from "@grammyjs/conversations";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import { addExtenseConversation } from "./conversations/addExtense";
import { start } from "./commands/start";
import { editCategoriesConversation } from "./conversations/editCategoriesConversation";
import { statsConversation } from "./conversations/statsConversation";

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
bot.api.setMyCommands([
  {
    command: "start",
    description: "Запуск бота.",
  },
]);
bot.use(conversations());
bot.use(hydrate());
bot.use(createConversation(addExtenseConversation));
bot.use(createConversation(editCategoriesConversation));
bot.use(createConversation(statsConversation));

bot.command("start", start);

bot.callbackQuery("add_extense", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("addExtenseConversation");
});

bot.callbackQuery("categories", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("editCategoriesConversation");
});

bot.callbackQuery("stats", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("statsConversation");
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
