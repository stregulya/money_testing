import { InlineKeyboard } from "grammy";
import { MyConversation, MyConversationContext } from "../bot";
import { getCategoriesKeyboard } from "../keyboards/categories";
import { mainMenu } from "../keyboards/mainMenu";
import { addCategory, getCategories } from "../db/categories.repo";
import { backToMenu } from "../helpers/backToMenu";
import { deleteMessage } from "../helpers/deleteUserMsg";
import { addExpense } from "../db/expense.repo";

export async function newExpenseConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  const userId = ctx.from?.id;
  if (!userId) throw new Error("Не удалось получить userId");

  const startCheckpoint = conversation.checkpoint();

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
    await backToMenu(categoryCtx);
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
      newCategoryCtx.callbackQuery &&
      newCategoryCtx.callbackQuery.data === "back_to_menu"
    ) {
      await newCategoryCtx.answerCallbackQuery();
      await backToMenu(newCategoryCtx);
      return;
    }

    const categoryName = newCategoryCtx.message?.text!;
    addCategory(userId, categoryName);

    await deleteMessage(newCategoryCtx);

    await conversation.rewind(startCheckpoint);
  }

  const categoryId = categoryCtx.callbackQuery.data.replace("category_", "");
  const selectedCategory = getCategories(userId).find(
    (cat) => cat.id.toString() === categoryId
  );

  const amountCheckpoint = conversation.checkpoint();

  await ctx.editMessageCaption({
    caption: `Категория: ${selectedCategory?.name}\nВведи сумму в рублях:`,
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
      await conversation.rewind(startCheckpoint);
    }

    amount = parseFloat(amountCtx.message?.text!);

    if (isNaN(amount)) {
      await ctx.editMessageCaption({
        caption: "Введите корректное значение!",
        reply_markup: new InlineKeyboard().text("🔙Назад", "back_to_menu"),
      });
    }
  }

  await deleteMessage(amountCtx!);

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
    await conversation.rewind(amountCheckpoint);
  }

  const comment = commentCtx.message?.text;

  await deleteMessage(commentCtx);

  addExpense(userId, amount, selectedCategory?.name!, comment!);

  await ctx.editMessageCaption({
    caption:
      "Успешно!\nПривет, этот бот поможет тебя контролировать твои расходы.\nВоспользуйся кнопками⬇️",
    reply_markup: mainMenu,
  });

  return;
}
