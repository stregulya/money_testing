import Database from "better-sqlite3";
import { join } from "path";

const dbFile = join(__dirname, "../../db.sqlite");

export const db = new Database(dbFile);

export async function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      comment TEXT,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL
    );
    `);
}
