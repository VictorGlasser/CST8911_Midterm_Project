const { app } = require('@azure/functions');
const { MongoClient } = require("mongodb");

const config = {
  url: "mongodb://localhost:27017/Crocs",
  dbName: "Crocs"
};

app.http('CreateCrocodile', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "crocodiles",
    handler: async (req, context) => {
        const crocodile= req.body || {}

        if (crocodile) {
            context.res = {
            status: 400,
            body: 'Crocodile data is required! '
            }
        }
        const connection = await MongoClient.connect(config.url, {
            useNewUrlParser: true
        });
        const db = connection.db(config.dbName);

        const Crocodiles = db.collection('crocodiles')

        try {
            const crocodiles = await Crocodiles.insert(crocodile)
            connection.close()

            context.res = {
            status: 201,
            body: crocodiles.ops[0]
            }
        } catch (error) {
            context.res = {
            status: 500,
            body: 'Error creating a new Crocodile: ' + error.message
            }
        }
    }
});
