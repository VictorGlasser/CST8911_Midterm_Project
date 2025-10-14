import sqlite3 from 'sqlite3';
import * as path from 'path';

interface ClientRow {
  secret_hash: string;
}

// database constants
const DB_FILE = 'oauth_clients.db';
const TABLE_NAME = 'clients';
const DB_PATH = path.join(path.resolve(__dirname, '..', '..'), DB_FILE);

// set up db connection pool
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(`FATAL: Could not connect to SQLite database at ${DB_PATH}`, err.message);
  } else {
    console.log(`Connected to SQLite database for client validation.`);
  }
});


// fetch hashed password from the database
export function getClientSecretHash(clientId: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const sql = `SELECT secret_hash FROM ${TABLE_NAME} WHERE client_id = ?`;

    db.get(sql, [clientId], (err: Error | null, row: ClientRow | undefined) => {
      if (err) {
        console.error(`Database error fetching client '${clientId}':`, err.message);
        reject(err);
      } else if (row) {
        resolve(row.secret_hash);
      } else {
        resolve(null);
      }
    });
  });
}
