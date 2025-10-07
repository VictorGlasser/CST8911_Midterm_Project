const { app } = require('@azure/functions');
const { MongoClient } = require("mongodb");
const jwt = require('jsonwebtoken');

const config = {
    url: "mongodb://localhost:27017",
    dbName: "Crocs",
    jwtSecret: "example_jwt_secret" // must match JWT_SECRET in OAuth server config
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
            jwt.verify(token, config.jwtSecret);
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
