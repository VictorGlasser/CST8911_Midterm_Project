const { app } = require('@azure/functions');
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');

const config = {
    url: "mongodb://localhost:27017",
    dbName: "Crocs",
    jwtSecret: "example_jwt_secret" // must match JWT_SECRET in OAuth server config
};

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
