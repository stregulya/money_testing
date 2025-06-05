import { db } from "./sqlite";
import { v4 as uuid } from "uuid";

export function addExtense(
  userId: number,
  amount: number,
  category: string,
  comment: string
) {
  if (comment === "-") comment = "";

  const stmt = db.prepare(`
    INSERT INTO expenses (id, user_id, amount, category, comment, date) VALUES (?, ?, ?, ?, ?, DATE('now'))
    `);
  stmt.run(uuid(), userId, amount, category, comment);
}

export function getExtense(userId: number) {}
