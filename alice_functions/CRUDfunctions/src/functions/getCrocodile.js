import { app } from '@azure/functions';
import { MongoClient } from 'mongodb';
import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';
import { DefaultAzureCredential } from '@azure/identity';
import crypto from 'crypto';

import base64url from 'base64url';

// configuration from environment variables
const config = {
  keyVaultUrl: process.env.AZURE_KEY_VAULT_URL,
  keyName: process.env.AZURE_KEY_NAME,
  url: process.env.MONGO_URL,
  dbName: process.env.MONGO_DB_NAME,
};

// initialize Azure clients
const credential = new DefaultAzureCredential();
const keyClient = new KeyClient(config.keyVaultUrl, credential);

let cryptoClient;

// initialize cryptography client for the key
async function initializeCryptoClient() {
  try {
    const key = await keyClient.getKey(config.keyName);
    cryptoClient = new CryptographyClient(key.id, credential);
  } catch (error) {
    throw new Error(`Failed to initialize CryptographyClient: ${error.message}`);
  }
}

const cryptoClientInitializationPromise = initializeCryptoClient();

// verify JWT using Azure Key Vault API
async function verifyJwtWithKeyVault(token) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Malformed JWT');
    }

    const signedData = `${headerB64}.${payloadB64}`;
    const hash = crypto.createHash('sha256').update(signedData, 'utf8').digest();
    const signature = base64url.toBuffer(signatureB64);

    await cryptoClientInitializationPromise;

    const verifyResult = await cryptoClient.verify("RS256", hash, signature);

    if (!verifyResult.result) {
      throw new Error('Invalid token signature');
    }

    // decode payload if valid
    const payloadJson = Buffer.from(payloadB64, 'base64').toString();
    const payload = JSON.parse(payloadJson);

    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
}

app.http('getCrocodile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: "crocodiles/{id}",
  handler: async (req) => {
    try {
      await cryptoClientInitializationPromise;
    } catch {
      return {
        status: 500,
        jsonBody: { error: 'Failed to initialize Key Vault cryptography client.' }
      };
    }

    // check authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        jsonBody: { error: 'Missing or invalid Authorization header' }
      };
    }

    const token = authHeader.split(' ')[1];

    // verify JWT signature via Key Vault
    try {
      await verifyJwtWithKeyVault(token);
    } catch (err) {
      return {
        status: 401,
        jsonBody: { error: 'Invalid or expired token' }
      };
    }

    const id = Number(req.params.id);

    if (!id) {
      return {
        status: 400,
        body: `Please enter a crocodile id number. ${id} is not valid.`
      }
    }

    // Connect to the MongoDB database and retrieve a crocodile species by its observation ID
    let client;
    try {
      client = await MongoClient.connect(config.url);
      const db = client.db(config.dbName);
      const data = await db.collection('crocodiles').findOne({ _id: id });

      return {
        status: 200,
        jsonBody: data
      };
    } catch (err) {
      return {
        status: 500,
        jsonBody: {
          error: `Failed database connection, ${err}`
        }
      };
    } finally {
      await client.close();
    }
  }
});
