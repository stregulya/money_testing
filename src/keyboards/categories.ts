import { InlineKeyboard } from "grammy";
import { getCategories } from "../db/categories.repo";

export function getCategoriesKeyboard(userId: number): InlineKeyboard {
  const categories = getCategories(userId);

  const keyboard = new InlineKeyboard();
  categories
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(({ name, id }) => {
      keyboard.text(name, `category_${id}`).row();
    });
  return keyboard;
}
