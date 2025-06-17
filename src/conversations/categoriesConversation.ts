import { MyConversation, MyConversationContext } from "../bot";
import { getCategoriesKeyboard } from "../keyboards/categories";
import { backToMenu } from "../helpers/backToMenu";
import { InlineKeyboard } from "grammy";
import {
  addCategory,
  deleteCategory,
  editCategory,
  getCategories,
} from "../db/categories.repo";
import { deleteMessage } from "../helpers/deleteUserMsg";
import { replyMenu } from "../helpers/replyMenu";

export async function categoriesConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  const userId = ctx.from?.id;
  if (!userId) throw new Error("Не удалось полуичть user id");

  const checkpoint = conversation.checkpoint();

  const categoriesKeyboard = getCategoriesKeyboard(userId);
  categoriesKeyboard
    .text("🔙Назад", "back_to_menu")
    .text("➕Добавить новую категорию", "new_category");

  await ctx.editMessageCaption({
    caption: "Категории",
    reply_markup: categoriesKeyboard,
  });

  const actionCtx = await conversation.waitFor([
    "callback_query:data",
    "message:text",
  ]);

  if (actionCtx.message?.text === "🏠 Меню") {
    await replyMenu(ctx);
    return;
  }

  if (!actionCtx.callbackQuery) return;

  if (actionCtx.callbackQuery.data === "back_to_menu") {
    await actionCtx.answerCallbackQuery();

    await backToMenu(ctx);
    return;
  }

  if (actionCtx.callbackQuery.data === "new_category") {
    await actionCtx.answerCallbackQuery();

    await ctx.editMessageCaption({
      caption: "Введите название новой категории⬇️",
      reply_markup: new InlineKeyboard().text("🔙Назад", "back_to_menu"),
    });

    const newCategoryCtx = await conversation.waitFor([
      "message:text",
      "callback_query:data",
    ]);

    if (newCategoryCtx.message?.text === "🏠 Меню") {
      await replyMenu(ctx);
      return;
    }

    if (
      newCategoryCtx.callbackQuery &&
      newCategoryCtx.callbackQuery.data === "back_to_menu"
    ) {
      await newCategoryCtx.answerCallbackQuery();

      await conversation.rewind(checkpoint);
    }

    const categoryName = newCategoryCtx.message?.text!;
    addCategory(userId, categoryName);

    await deleteMessage(newCategoryCtx);

    await conversation.rewind(checkpoint);
  }

  const categoryId = parseFloat(
    actionCtx.callbackQuery.data.replace("category_", "")
  );

  const selectedCategory = getCategories(userId).find(
    (cat) => cat.id === categoryId
  );
  if (!selectedCategory) throw new Error("Не удалось найти категорию");

  const editKeyboard = new InlineKeyboard()
    .text("Удалить", "delete_category")
    .text("Изменить", "edit_category")
    .row()
    .text("🔙Назад", "back_to_menu");

  await ctx.editMessageCaption({
    caption: `Вы выбрали ${selectedCategory.name}\nИспользуйте кнопки⬇️`,
    reply_markup: editKeyboard,
  });

  const editCategoryCtx = await conversation.waitFor([
    "callback_query:data",
    "message:text",
  ]);

  if (editCategoryCtx.message?.text === "🏠 Меню") {
    await replyMenu(ctx);
    return;
  }

  editCategoryCtx.answerCallbackQuery();

  if (editCategoryCtx.callbackQuery!.data === "back_to_menu") {
    await conversation.rewind(checkpoint);
  }

  if (editCategoryCtx.callbackQuery!.data === "delete_category") {
    deleteCategory(userId, selectedCategory.name);
    await conversation.rewind(checkpoint);
  }

  if (editCategoryCtx.callbackQuery!.data === "edit_category") {
    await ctx.editMessageCaption({
      caption: "Введите новое название для категории:",
    });

    const newName = await conversation.waitFor("message:text");

    if (editCategoryCtx.message?.text === "🏠 Меню") {
      await replyMenu(ctx);
      return;
    }

    editCategory(userId, selectedCategory.name, newName.msg.text);

    await deleteMessage(newName);

    await conversation.rewind(checkpoint);
  }
}
