import { MyConversationContext } from "../bot";
import { mainMenu } from "../keyboards/mainMenu";

export async function backToMenu(ctx: MyConversationContext) {
  await ctx.editMessageCaption({
    caption:
      "Привет, этот бот поможет тебя контролировать твои расходы.\nВоспользуйся кнопками⬇️",
    reply_markup: mainMenu,
  });
}
