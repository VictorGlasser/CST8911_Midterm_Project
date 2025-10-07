import express, { Express } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import tokenRoute from './routes/token';

dotenv.config();
const app: Express = express();

app.use(bodyParser.json());
app.use('/oauth', tokenRoute);

app.listen(process.env.PORT, () => {
  console.log(`OAuth server running on port ${process.env.PORT}`);
});

