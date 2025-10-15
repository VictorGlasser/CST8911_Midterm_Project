const { app } = require('@azure/functions');
const { MongoClient, ObjectId } = require("mongodb");
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
    throw new Error("Failed to load public key");
}

// use environment variables for config
const config = {
    url: process.env.MONGO_URL,
    dbName: process.env.MONGO_DB_NAME,
};

app.http('deleteCrocodile', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: "crocodiles/{id}",
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
            const data = await db.collection('crocodiles').deleteOne({ _id: id });

            if (data.deletedCount === 0) {
                return {
                    status: 404,
                    jsonBody: { error: `No crocodile found with ID ${id}` }
                };
            }

            return {
                status: 200,
                jsonBody: { message: `Crocodile with ID ${id} exterminated successfully.` }
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
