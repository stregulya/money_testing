import { InlineKeyboard } from "grammy";

export const mainMenu = new InlineKeyboard()
  .text("➕Добавить новый расход", "new_expense")
  .row()
  .text("Расходы", "expense")
  .row()
  .text("Менеджер категорий", "categories");
