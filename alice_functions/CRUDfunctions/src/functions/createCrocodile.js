const { app } = require('@azure/functions');
const { MongoClient } = require("mongodb");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// load public key
let publicKeyContent;
try {
    const PUBLIC_KEY_FILENAME = 'public.pem';
    const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
    const PUBLIC_KEY_PATH = path.join(PROJECT_ROOT, PUBLIC_KEY_FILENAME);
    publicKeyContent = fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8');
} catch (error) {
    throw new Error(`Failed to load public key, ${error}`);
}

// use environment variables for config
const config = {
    url: process.env.MONGO_URL,
    dbName: process.env.MONGO_DB_NAME,
};

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
            jwt.verify(token, publicKeyContent, { algorithms: ['RS256'] });
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
