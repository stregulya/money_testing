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

export function getExtense(userId: number): {
  category: string;
  amount: number;
  comment: string;
  date: Date;
  id: string;
}[] {
  const stmt = db.prepare(
    "SELECT category, amount, comment, date, id FROM expenses WHERE user_id = ?"
  );
  return (
    stmt.all(userId) as {
      category: string;
      amount: number;
      comment: string;
      date: string;
      id: string;
    }[]
  ).map((extense) => {
    return {
      category: extense.category,
      amount: extense.amount,
      comment: extense.comment,
      date: new Date(extense.date),
      id: extense.id,
    };
  });
}
