# High Level Deployment Overview

## Migrate local Database to Cosmsos DB

1. Create a new Azure Cosmos DB for MongoDB
2. Select vCore
  - Request unit would typically be cheaper for our use case, but vCore has a free tier
3. Run mongodump to dump the database for migration

```bash
mongodump --out ./dump
```

4. Run mongorestore to restore the dump on the cosmos db cluster

```bash
mongorestore --uri '<cluster connection string>' ./dump
```

## Setup OAuth server

1. Create ubuntu VM
2. install node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs
```

3. Clone the repo

```bash
git clone https://github.com/VictorGlasser/CST8911_Midterm_Project.git
```

4. cd into the oauth directory

```bash
cd CST8911_Midterm_Project/oauth/
```

5. install dependencies

```bash
npm install
```

6. generate RSA key pair

```bash
node generateKeys.js
```

7. register client

```bash
node registerClient.js
```

8. configure environment variables

```
PORT=8080
TOKEN_EXPIRY=3600
```

9. start the server

```bash
npx ts-node src/
```

10. Make sure the selected port is open

## Deploy Azure Functions

1. on local machine, cd to the CRUDfunctions directory

2. download the public key from the OAuth server

```bash
scp <oauth host name>:/home/<username>/CST8911_Midterm_Project/oauth/public.pem ./
```

3. create a consumption plan functions app on azure portal

4. deploy functions

```bash
func azure functionapp publish <functions app name>
```

5. add environment variables to the functions

```
MONGO_URL = <mongo connection string>
MONGO_DB_NAME Crocs
```
