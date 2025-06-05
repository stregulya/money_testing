import { InlineKeyboard } from "grammy";

export const menuKeyboard = new InlineKeyboard()
  .text("➕Добавить новый расход", "add_extense")
  .row()
  .text("Статистика", "stats")
  .row()
  .text("Менеджер категорий", "categories")
  .text("Профиль", "profile");
