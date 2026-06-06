// Opens the SQLite database (music-connect.db). The schema is in db/schema.sql
// and runs once when the connection is first opened.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'music-connect.db');
const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  // read schema.sql and run it (CREATE TABLE IF NOT EXISTS means it's safe to run every time)
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(sql);
}

export default getDb;
