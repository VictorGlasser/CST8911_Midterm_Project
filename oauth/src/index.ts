import express, { Express } from 'express';
import bodyParser from 'body-parser';
import tokenRoute from './routes/token';
import { keyVaultInitializationPromise } from './utils/azureKeyVault';

const app: Express = express();

app.use(bodyParser.json());
app.use('/oauth', tokenRoute);


async function startServer() {
  try {
    // wait for key vault to be initializated
    await keyVaultInitializationPromise;

    app.listen(process.env.PORT, () => {
      console.log(`OAuth server running on port ${process.env.PORT}`);
      console.log(`Using Azure Key Vault at: ${process.env.AZURE_KEY_VAULT_URL}`);
    });
  } catch (error) {
    console.error("Server failed to start due to key vault initialization error");
    process.exit(1);
  }
}

startServer();
