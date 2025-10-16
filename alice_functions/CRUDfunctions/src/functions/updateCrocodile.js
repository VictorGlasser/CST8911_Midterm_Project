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

// Define fields in the crocodile schema
const allowedFields = [
    "Common Name",
    "Scientific Name",
    "Family",
    "Genus",
    "Observed Length (m)",
    "Observed Weight (kg)",
    "Age Class",
    "Sex",
    "Date of Observation",
    "Country/Region",
    "Habitat Type",
    "Conservation Status",
    "Observer Name",
    "Notes"
];

app.http('updateCrocodile', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: "crocodiles/{id}",
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

        const id = Number(req.params.id);

        if (!id) {
            return {
                status: 400,
                body: `Please enter a crocodile id number. ${id} is not valid.`
            }
        }

        // Retrieve changes from body
        let updates;
        try {
            updates = await req.json();
        } catch {
            return {
                status: 400,
                jsonBody: { error: 'Invalid JSON in request body' }
            };
        }

        // Validate update keys
        const invalidKeys = Object.keys(updates).filter(key => !allowedFields.includes(key));
        if (invalidKeys.length > 0) {
            return {
                status: 400,
                jsonBody: {
                    error: `Invalid field(s): ${invalidKeys.join(', ')}`,
                    allowedFields
                }
            };
        }

        if (!updates || Object.keys(updates).length === 0) {
            return {
                status: 400,
                jsonBody: { error: 'No update fields provided in request body.' }
            }
        };

        // Connect to the MongoDB database and retrieve a crocodile species by its observation ID to update
        let client;
        try {
            client = await MongoClient.connect(config.url);
            const db = client.db(config.dbName);
            const data = await db.collection('crocodiles').updateOne(
                { _id: id },
                { $set: updates }
            );


            if (data.matchedCount === 0) {
                return {
                    status: 404,
                    jsonBody: { error: `No crocodile found with ID ${id}` }
                };
            }

            return {
                status: 200,
                jsonBody: { message: `Crocodile with ID ${id} updated successfully.` }
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
