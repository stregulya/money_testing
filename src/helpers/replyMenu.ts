import { MAINIMAGE, MyConversationContext } from "../bot";
import { mainMenu } from "../keyboards/mainMenu";

export async function replyMenu(ctx: MyConversationContext) {
  await ctx.replyWithPhoto(MAINIMAGE, {
    caption:
      "Привет, этот бот поможет тебя контролировать твои расходы.\nВоспользуйся кнопками⬇️",
    reply_markup: mainMenu,
  });
}
