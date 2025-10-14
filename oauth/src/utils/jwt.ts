import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const PRIVATE_KEY_FILENAME = 'private.pem';
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PRIVATE_KEY_PATH = path.join(PROJECT_ROOT, PRIVATE_KEY_FILENAME);

let privateKeyContent: string;

// try to load the private key
try {
  privateKeyContent = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');
  console.log('Successfully loaded private key.');
} catch (error) {
  console.error(`Error loading private key from ${PRIVATE_KEY_PATH}:`, error);
  throw new Error("Failed to load private key. Check 'private-key.pem' location and permissions.");
}

// generate a token that is signed by the private key
export function generateToken(clientId: string): string {
  return jwt.sign(
    { sub: clientId, iss: 'OAuthServer', scope: 'api.read' },
    privateKeyContent,
    {
      expiresIn: Number(process.env.TOKEN_EXPIRY),
      algorithm: 'RS256'
    }
  );
}

