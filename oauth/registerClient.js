const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const readline = require('readline');

// setup readline interface for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getInput(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// initialize client credential database
const DB_FILE = 'oauth_clients.db';
const TABLE_NAME = 'clients';
function initializeDB(db) {
  return new Promise((resolve, reject) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          client_id TEXT PRIMARY KEY,
          secret_hash TEXT NOT NULL
        );
      `;
    db.run(sql, (err) => {
      if (err) {
        console.error("Error creating table:", err.message);
        reject(err);
      } else {
        console.log("Database initialized");
        resolve();
      }
    });
  });
}

// register a new client for OAuth
function registerClient(db, clientId, secretHash) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO ${TABLE_NAME} (client_id, secret_hash) VALUES (?, ?)`;
    db.run(sql, [clientId, secretHash], function (err) {
      if (err) {
        console.error(`Error inserting client '${clientId}': ${err.message}`);
        reject(err);
      } else {
        console.log(`Client '${clientId}' registered successfully!`);
        resolve();
      }
    });
  });
}

async function main() {
  // connect to db
  const db = new sqlite3.Database(DB_FILE, async (err) => {
    if (err) {
      console.error("Could not connect to database:", err.message);
      rl.close();
      return;
    }
    await initializeDB(db);

    try {
      // get input for Id and password
      const clientId = await getInput('Enter client ID: ');
      if (!clientId) throw new Error("Client ID cannot be empty.");

      const clientSecret = await getInput('Enter client password: ');
      if (!clientSecret) throw new Error("Client password cannot be empty.");

      // hash  password
      console.log("Hashing client password...");
      const secretHash = await bcrypt.hash(clientSecret, 10);
      console.log("Successfully hashed client password");

      // register the client in the database
      await registerClient(db, clientId, secretHash);

    } catch (error) {
      console.error("Operation failed:", error.message);
    } finally {
      db.close();
      rl.close();
    }
  });
}

main();
