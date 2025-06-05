import { InlineKeyboard } from "grammy";
import { MyConversation, MyConversationContext } from "../bot";
import {
  addCategory,
  deleteCategory,
  editCategory,
  getCategories,
} from "../db/categories.repo";
import { menuKeyboard } from "../keyboards/menu";
import { getCategoriesKeyboard } from "../keyboards/categories";

export async function editCategoriesConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  return await showCategoriesMenu(conversation, ctx);
}

async function showCategoriesMenu(
  conversation: MyConversation,
  ctx: MyConversationContext
): Promise<void> {
  const userId = ctx.from?.id!;

  const categoriesKeyboard = getCategoriesKeyboard(userId);
  categoriesKeyboard
    .text("⬅ Вернуться", "back_to_menu")
    .text("➕ Добавить категорию", "add_category");

  await ctx.editMessageCaption({
    caption: "Менеджер категорий:\nВыберите категорию или создайте новую.",
    reply_markup: categoriesKeyboard,
  });

  const actionCtx = await conversation.waitFor("callback_query:data");
  const action = actionCtx.callbackQuery.data;
  await actionCtx.answerCallbackQuery();

  if (action === "back_to_menu") {
    await ctx.editMessageCaption({
      caption:
        "Добро пожаловать!\nЭтот бот поможет тебя для контроля твоих расходов.\nНажми на кнопки ниже⬇️",
      reply_markup: menuKeyboard,
    });
    return;
  }

  if (action === "add_category") {
    await ctx.editMessageCaption({
      caption: "Введите название для новой категории",
    });
    const msgCategory = await conversation.waitFor("message:text");

    try {
      msgCategory.api.deleteMessage(msgCategory.chat.id, msgCategory.msgId);
    } catch (error) {
      console.error("Не удалось удалить сообщение:", error);
    }

    addCategory(userId, msgCategory.message?.text);
    return await showCategoriesMenu(conversation, ctx);
  }

  const selectedCategoryId = action.replace("category_", "");
  const selectedCategory = getCategories(userId).find(
    (cat) => cat.id === parseInt(selectedCategoryId)
  );

  if (!selectedCategory) {
    return await showCategoriesMenu(conversation, ctx);
  }

  return await showCategoryAction(
    conversation,
    ctx,
    selectedCategory.name,
    selectedCategory.id
  );
}

async function showCategoryAction(
  conversation: MyConversation,
  ctx: MyConversationContext,
  categoryName: string,
  categoryId: number
) {
  const userId = ctx.from?.id!;

  const keyboard = new InlineKeyboard()
    .text("✏ Изменить", "edit")
    .text("❌ Удалить", "delete")
    .row()
    .text("⬅ Назад", "back");

  await ctx.editMessageCaption({
    caption: `Вы выбрали категорию: *${categoryName}*`,
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });

  const actionCtx = await conversation.waitFor("callback_query:data");
  const action = actionCtx.callbackQuery.data;
  await actionCtx.answerCallbackQuery();

  if (action === "back") {
    return await showCategoriesMenu(conversation, ctx);
  }

  if (action === "edit") {
    await ctx.editMessageCaption({ caption: "Введите новое имя категории:" });
    const newName = await conversation.form.text();

    editCategory(userId, categoryName, newName);

    return await showCategoriesMenu(conversation, ctx);
  }

  if (action === "delete") {
    deleteCategory(userId, categoryName);
    return await showCategoriesMenu(conversation, ctx);
  }
}
