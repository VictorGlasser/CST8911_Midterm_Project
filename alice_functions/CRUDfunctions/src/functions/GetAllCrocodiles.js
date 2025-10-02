const { app } = require('@azure/functions');
const { MongoClient } = require("mongodb");

const config = {
  url: "mongodb://localhost:27017/Crocs",
  dbName: "Crocs"
};

app.http('GetAllCrocodiles', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: "crocodiles",
    handler: async (context) => {
        const connection = await MongoClient.connect(config.url, {
            useNewUrlParser: true
        });
        const db = connection.db(config.dbName);

        const Crocodiles = db.collection('crocodiles')
        const res = await Crocodiles.find({})
        const body = await res.toArray()


        connection.close()

        context.res = {
            status: 200,
            body
        }
    }
});
