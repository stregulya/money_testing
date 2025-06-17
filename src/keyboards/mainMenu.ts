import { InlineKeyboard } from "grammy";

export const mainMenu = new InlineKeyboard()
  .text("➕Добавить новый расход", "new_extense")
  .row()
  .text("Менеджер категорий", "categories");
