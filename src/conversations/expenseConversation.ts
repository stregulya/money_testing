import { InlineKeyboard } from "grammy";
import { MyConversation, MyConversationContext } from "../bot";
import { getCategories } from "../db/categories.repo";
import { backToMenu } from "../helpers/backToMenu";
import { getAllExpense, getWeekExpense } from "../db/expense.repo";
import { replyMenu } from "../helpers/replyMenu";

export async function expenseConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  const userId = ctx.from?.id;
  if (!userId) throw new Error("Не удалось получить user id");

  const allExpense = getAllExpense(userId);
  const weekExpense = getWeekExpense(userId);

  const categories = getCategories(userId);

  const sum = allExpense.reduce((acc, ex) => {
    return acc + ex.amount;
  }, 0);

  const totalsByCategory: Record<string, number> = {};

  for (const expense of allExpense) {
    totalsByCategory[expense.category] =
      (totalsByCategory[expense.category] || 0) + expense.amount;
  }

  const stats = categories.map((cat) => {
    return { name: cat.name, amount: totalsByCategory[cat.name] || 0 };
  });

  const statsString = stats.reduce((acc, stat) => {
    return acc + `${stat.name}: ${stat.amount} руб.\n`;
  }, "");

  const weekStats = weekExpense.reduce((acc, ex) => {
    return (
      acc +
      `${ex.category}: ${ex.amount} руб. (${
        ex.comment
      }) ${ex.date.toLocaleDateString()}` +
      "\n"
    );
  }, "");

  await ctx.editMessageCaption({
    caption:
      `Всего вы потратили: <i><b>${sum} руб.</b></i>\n\n` +
      statsString +
      "\nПоследние расходы:\n" +
      weekStats,
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().text("🔙Назад", "back_to_menu"),
  });

  const actionCtx = await conversation.waitFor(
    ["callback_query:data", "message:text"],
    {
      otherwise: async (ctx) =>
        await ctx.reply(
          "Нажми кнопку меню внизу экрана или выбери предложенное дейстие"
        ),
    }
  );

  if (actionCtx.message?.text === "🏠 Меню") {
    await replyMenu(ctx);
    return;
  }

  if (actionCtx.callbackQuery!.data === "back_to_menu") {
    await actionCtx.answerCallbackQuery();

    await backToMenu(ctx);
    return;
  }
}
