const { app } = require('@azure/functions');
const { MongoClient } = require("mongodb");
const jwt = require('jsonwebtoken');

// use environment variables for config
const config = {
  url: process.env.MONGO_URL,
  dbName: process.env.MONGO_DB_NAME,
  jwtSecret: process.env.JWT_SECRET
};


app.http('getAllCrocodiles', {
  methods: ['GET'],
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

    // connect to mongodb
    let client;
    try {
      client = await MongoClient.connect(config.url);
      const db = client.db(config.dbName);
      const data = await db.collection('crocodiles').find({}).toArray();

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

