import { db } from "./sqlite";

export function getCategories(userId: number): { name: string; id: number }[] {
  const stmt = db.prepare("SELECT name, id FROM categories WHERE user_id = ?");
  return (stmt.all(userId) as { name: string; id: number }[]).map(
    (category) => {
      return { name: category.name, id: category.id };
    }
  );
}

export function addCategory(userId: number, name: string) {
  const exists = getCategories(userId).find((cat) => cat.name === name);
  if (!exists) {
    const stmt = db.prepare(
      "INSERT INTO categories (user_id, name) VALUES (?, ?)"
    );
    stmt.run(userId, name);
  }
}

export function editCategory(userId: number, name: string, newName: string) {
  const exists = getCategories(userId).find((cat) => cat.name === name);
  if (!exists) return;
  const stmt = db.prepare(
    "UPDATE categories SET name = ? WHERE user_id = ? AND name = ?"
  );
  stmt.run(newName, userId, name);
}

export function deleteCategory(userId: number, name: string) {
  const exists = getCategories(userId).find((cat) => cat.name === name);
  if (!exists) return;
  const stmt = db.prepare(
    "DELETE FROM categories WHERE user_id = ? AND name = ?"
  );
  const stmt2 = db.prepare(
    "DELETE FROM expenses WHERE user_id = ? AND category = ?"
  );
  stmt.run(userId, name);
  stmt2.run(userId, name);
}
