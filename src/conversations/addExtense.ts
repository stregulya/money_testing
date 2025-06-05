import { InlineKeyboard, InputFile } from "grammy";
import { MyConversation, MyConversationContext } from "../bot";
import { addCategory, getCategories } from "../db/categories.repo";
import { menuKeyboard } from "../keyboards/menu";
import { addExtense } from "../db/expense.repo";
import { getCategoriesKeyboard } from "../keyboards/categories";

export async function addExtenseConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  const userId = ctx.from?.id!;

  const categories = getCategories(ctx.from?.id!);

  const categoriesKeyboard = getCategoriesKeyboard(userId);
  categoriesKeyboard
    .text("➕Добавить новую категорию", "add_new_category")
    .row()
    .text("Вернуться⬅️", "back_to_menu");

  await ctx.editMessageCaption({
    caption: "Выбери категорию:",
    reply_markup: categoriesKeyboard,
  });

  const categoryCtx = await conversation.waitFor("callback_query:data", {
    otherwise: (ctx) => ctx.reply("Нажми на кнопку!"),
  });
  const action = categoryCtx.callbackQuery.data;
  await categoryCtx.answerCallbackQuery();

  if (action === "back_to_menu") {
    await ctx.editMessageCaption({
      caption:
        "Добро пожаловать!\nЭтот бот поможет тебя для контроля твоих расходов.\nНажми на кнопки ниже⬇️",
      reply_markup: menuKeyboard,
    });
    return;
  }

  if (action === "add_new_category") {
    await ctx.editMessageCaption({
      caption: "Введите название для новой категории",
    });
    const msg = await conversation.waitFor("message:text");

    try {
      await msg.api.deleteMessage(msg.chatId, msg.msgId);
    } catch (error) {
      console.error("Не удалось удалить сообщение: ", error);
    }

    addCategory(ctx.chat?.id!, msg.message.text);
    await addExtenseConversation(conversation, ctx);
    return;
  }

  const selected = categories.find(
    (cat) => cat.id === parseInt(action.replace("category_", ""))
  )?.name;

  if (!selected) {
    await ctx.reply("Категория не найдена. Попробуйте еще раз.");
    return;
  }

  await ctx.editMessageCaption({
    caption: `Введите сумму:`,
  });

  let amount: number | null = null;

  while (amount === null || isNaN(amount)) {
    const msgAmountString = await conversation.waitFor("message:text");
    amount = parseFloat(msgAmountString.message.text);

    if (isNaN(amount)) {
      await ctx.reply(
        "Пожалуйста, введи корректную сумму, например: `150.75`",
        {
          parse_mode: "Markdown",
        }
      );
    }
  }

  await ctx.editMessageCaption({
    caption: "Напиши комментарий или отправь '-', чтобы оставить его пустым",
  });
  const comment = await conversation.form.text();

  addExtense(ctx.from?.id!, amount, selected!, comment);
  await ctx.reply("Успешно!");

  const file = new InputFile("./src/imgs/main.png");
  await ctx.replyWithPhoto(file, {
    caption:
      "Добро пожаловать!\nЭтот бот поможет тебя для контроля твоих расходов.\nНажми на кнопки ниже⬇️",
    reply_markup: menuKeyboard,
  });
  return;
}
