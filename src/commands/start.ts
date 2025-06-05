import { InputFile } from "grammy";
import { menuKeyboard } from "../keyboards/menu";
import { MyContext } from "../bot";

export async function start(ctx: MyContext) {
  const file = new InputFile("./src/imgs/main.png");
  await ctx.replyWithPhoto(file, {
    caption:
      "Добро пожаловать!\nЭтот бот поможет тебя для контроля твоих расходов.\nНажми на кнопки ниже⬇️",
    reply_markup: menuKeyboard,
  });
}
