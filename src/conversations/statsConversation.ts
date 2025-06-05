import { InlineKeyboard } from "grammy";
import { MyConversation, MyConversationContext } from "../bot";
import { getExtense } from "../db/expense.repo";
import { menuKeyboard } from "../keyboards/menu";

export async function statsConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  const userId = ctx.from?.id!;

  const keyboard = new InlineKeyboard();
  const extenses = getExtense(userId);

  extenses.forEach((ex) => {
    keyboard
      .text(
        `Категория: ${ex.category} Цена: ${
          ex.amount
        }руб. Дата: ${ex.date.toLocaleDateString()}`,
        `${ex.id}`
      )
      .row();
  });

  keyboard.text("⬅ Вернуться", "back_to_menu");

  const allAmount = extenses.reduce((acc, cur) => {
    return acc + cur.amount;
  }, 0);

  await ctx.editMessageCaption({
    caption: `Всего вы потратили: ${allAmount}руб.`,
    reply_markup: keyboard,
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
}
