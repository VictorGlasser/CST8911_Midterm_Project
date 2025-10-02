const { app } = require('@azure/functions');
const { MongoClient } = require("mongodb");

const config = {
  url: "mongodb://localhost:27017/Crocs",
  dbName: "Crocs"
};

app.http('GetCrocodile', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: "crocodiles/{id}",
    handler: async (req, context) => {
        const { id } = req.params

        if (!id) {
            context.res = {
            status: 400,
            body: 'Please enter the correct Observation Id number!'
            }

            return
        }

        // Connect to the MongoDB database and retrieve a crocodile species by its observation ID
        const connection = await MongoClient.connect(config.url, {
            useNewUrlParser: true
        });
        const db = connection.db(config.dbName);

        const Crocodiles = db.collection('crocodiles')

        try {
            const body = await Crocodiles.findOne({ _id: MongoClient(id) })

            connection.close()
            context.res = {
            status: 200,
            body
            }
        } catch (error) {
            context.res = {
            status: 500,
            body: `Error: ${error.message}`
            }
        }
    }
});
