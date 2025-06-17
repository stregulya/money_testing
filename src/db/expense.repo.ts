import { db } from "./sqlite";
import { v4 as uuid } from "uuid";

export function addExpense(
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

export function getAllExpense(userId: number): {
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
  ).map((ex) => {
    return {
      category: ex.category,
      amount: ex.amount,
      comment: ex.comment,
      date: new Date(ex.date),
      id: ex.id,
    };
  });
}

export function getWeekExpense(userId: number): {
  category: string;
  amount: number;
  comment: string;
  date: Date;
  id: string;
}[] {
  const stmt = db.prepare(
    "SELECT * FROM expenses WHERE user_id = ? AND date >= DATE('now', '-7 days')"
  );
  return (
    stmt.all(userId) as {
      category: string;
      amount: number;
      comment: string;
      date: string;
      id: string;
    }[]
  ).map((ex) => {
    return {
      category: ex.category,
      amount: ex.amount,
      comment: ex.comment,
      date: new Date(ex.date),
      id: ex.id,
    };
  });
}
