import { InlineKeyboard } from "grammy";
import { MAINIMAGE, MyConversation, MyConversationContext } from "../bot";
import { getCategoriesKeyboard } from "../keyboards/categories";
import { mainMenu } from "../keyboards/mainMenu";
import { addCategory, getCategories } from "../db/categories.repo";
import { addExtense } from "../db/expense.repo";

export async function newExtenseConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  const userId = ctx.from?.id;
  if (!userId) throw new Error("Не удалось получить userId");

  const categoriesKeyboard = getCategoriesKeyboard(userId);
  categoriesKeyboard
    .text("🔙Назад", "back_to_menu")
    .text("➕Добавить новую категорию", "new_category");

  await ctx.editMessageCaption({
    caption: "Выбери категорию",
    reply_markup: categoriesKeyboard,
  });

  const categoryCtx = await conversation.waitFor("callback_query:data");
  await categoryCtx.answerCallbackQuery();

  if (categoryCtx.callbackQuery.data === "back_to_menu") {
    backToMenu(categoryCtx);
    return;
  }

  if (categoryCtx.callbackQuery.data === "new_category") {
    await ctx.editMessageCaption({
      caption: "Введите название новой категории⬇️",
      reply_markup: new InlineKeyboard().text("🔙Назад", "back_to_menu"),
    });

    const newCategoryCtx = await conversation.waitFor([
      "message:text",
      "callback_query:data",
    ]);

    if (
      (newCategoryCtx.callbackQuery &&
        newCategoryCtx.callbackQuery.data === "back_to_menu") ||
      newCategoryCtx.message?.text === "📱Меню"
    ) {
      await newCategoryCtx.answerCallbackQuery();
      backToMenu(newCategoryCtx);
      return;
    }

    const categoryName = newCategoryCtx.message?.text!;
    addCategory(userId, categoryName);

    try {
      newCategoryCtx.message?.delete();
    } catch (error) {
      console.error("Не удалось удалить сообщение: ", error);
    }

    await newExtenseConversation(conversation, categoryCtx);
  }

  const categoryId = categoryCtx.callbackQuery.data.replace("category_", "");
  const selectedCategory = getCategories(userId).find(
    (cat) => cat.id.toString() === categoryId
  );

  await ctx.editMessageCaption({
    caption: `Категория: ${selectedCategory?.name}\nВведи сумму:`,
    reply_markup: new InlineKeyboard().text("🔙Назад", "back_to_menu"),
  });

  let amount: number | null = null;
  let amountCtx;

  while (amount === null || isNaN(amount)) {
    amountCtx = await conversation.waitFor([
      "message:text",
      "callback_query:data",
    ]);

    if (
      amountCtx.callbackQuery &&
      amountCtx.callbackQuery.data === "back_to_menu"
    ) {
      amountCtx.answerCallbackQuery();
      backToMenu(amountCtx);
      await conversation.halt();
    }

    amount = parseFloat(amountCtx.message?.text!);

    if (isNaN(amount)) {
      await ctx.editMessageCaption({
        caption: "Введите корректное значение!",
        reply_markup: new InlineKeyboard().text("🔙Назад", "back_to_menu"),
      });
    }
  }

  try {
    await amountCtx?.api.deleteMessage(amountCtx.chatId!, amountCtx.msgId!);
  } catch (error) {
    console.error("Не удалось удалить сообщение: ", error);
  }

  await ctx.editMessageCaption({
    caption: `Категория: ${selectedCategory?.name}\nСумма: ${amount}руб.\nНапиши комментарий или отправь '-', чтобы оставить его пустым`,
    reply_markup: new InlineKeyboard().text("🔙Назад", "back_to_menu"),
  });

  const commentCtx = await conversation.waitFor([
    "message:text",
    "callback_query:data",
  ]);

  if (
    commentCtx.callbackQuery &&
    commentCtx.callbackQuery.data === "back_to_menu"
  ) {
    commentCtx.answerCallbackQuery();
    backToMenu(categoryCtx);
    return;
  }

  const comment = commentCtx.message?.text;

  try {
    await commentCtx?.api.deleteMessage(commentCtx.chatId!, commentCtx.msgId!);
  } catch (error) {
    console.error("Не удалось удалить сообщение: ", error);
  }

  addExtense(userId, amount, selectedCategory?.name!, comment!);

  await ctx.editMessageCaption({
    caption:
      "Успешно!\nПривет, этот бот поможет тебя контролировать твои расходы.\nВоспользуйся кнопками⬇️",
    reply_markup: mainMenu,
  });

  return;
}

async function backToMenu(ctx: MyConversationContext) {
  await ctx.editMessageCaption({
    caption:
      "Привет, этот бот поможет тебя контролировать твои расходы.\nВоспользуйся кнопками⬇️",
    reply_markup: mainMenu,
  });
}
