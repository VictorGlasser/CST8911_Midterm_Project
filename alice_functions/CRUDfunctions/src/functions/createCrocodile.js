import { app } from '@azure/functions';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import { KeyClient } from '@azure/keyvault-keys';
import { DefaultAzureCredential } from '@azure/identity';
import jwkToPem from 'jwk-to-pem';
import base64url from 'base64url';


// use environment variables for config
const config = {
    keyVaultUrl: process.env.AZURE_KEY_VAULT_URL,
    keyName: process.env.AZURE_KEY_NAME,
    url: process.env.MONGO_URL,
    dbName: process.env.MONGO_DB_NAME,
};

// initialize azure key vault client
const credential = new DefaultAzureCredential();
const keyClient = new KeyClient(config.keyVaultUrl, credential);

// variable to store the fetched public key content
let publicKey;

 // fetch public key from key vault and convert to pem format
async function initializePublicKey() {
    try {
        const key = await keyClient.getKey(config.keyName);
        const jwkKey = key.key;

        // check for required RSA components
        if (!jwkKey || jwkKey.kty !== 'RSA' || !jwkKey.n || !jwkKey.e) {
            throw new Error("key is not a valid RSA key");
        }
        
        // convert buffers to 64 bit encoded strings
        jwkKey.n = base64url(jwkKey.n);
        jwkKey.e = base64url(jwkKey.e);

        // convert key to required format for jwt validation
        publicKey = jwkToPem(jwkKey);
    } catch {
        throw new Error("public key initialization failed");
    }
}

const publicKeyInitializationPromise = initializePublicKey();

// Default values for all fields
const defaultCrocodile = {
    "Common Name": "Unknown Crocodile",
    "Scientific Name": "Unknown",
    "Family": "Unknown",
    "Genus": "Unknown",
    "Observed Length (m)": null,
    "Observed Weight (kg)": null,
    "Age Class": "Unknown",
    "Sex": "Unknown",
    "Date of Observation": new Date().toISOString().split('T')[0],
    "Country/Region": "Unknown",
    "Habitat Type": "Unknown",
    "Conservation Status": "Unknown",
    "Observer Name": "Anonymous",
    "Notes": ""
};

app.http('createCrocodile', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "crocodiles",
    handler: async (req) => {
        try {
            await publicKeyInitializationPromise;
        } catch (e) {
            return {
                status: 500,
                jsonBody: { error: 'Failed to retrieve public key.' }
            };
        }

        // check header for token
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                status: 401,
                jsonBody: { error: 'Missing or invalid Authorization header' }
            };
        }

        const token = authHeader.split(' ')[1];

        // verify validity of token
        try {
            jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        } catch {
            return {
                status: 401,
                jsonBody: { error: 'Invalid or expired token' }
            };
        }

        let crocodile;
        try {
            crocodile = await req.json();
        } catch {
            return {
                status: 400,
                jsonBody: { error: 'Invalid JSON in request body' }
            };
        }

        if (!crocodile) {
            return {
                status: 400,
                body: `Crocodile data is required! ${crocodile}`
            }
        }

        // Merge provided fields with defaults
        crocodile = { ...defaultCrocodile, ...crocodile };


        let client;
        try {
            client = await MongoClient.connect(config.url);
            const db = client.db(config.dbName);
            const crocodiles = db.collection('crocodiles')

            // Find the highest _id
            const lastEntry = await crocodiles.find().sort({ _id: -1 }).limit(1).toArray();
            const nextId = lastEntry.length > 0 ? lastEntry[0]._id + 1 : 1;

            // Assign new _id
            crocodile._id = nextId;

            // Insert the new crocodile
            await crocodiles.insertOne(crocodile);

            return {
                status: 200,
                jsonBody: `Created new crocodile: ${JSON.stringify(crocodile)}`
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
