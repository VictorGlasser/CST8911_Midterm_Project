import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import base64url from "base64url";
import { signJwtWithKeyVault } from "./azureKeyVault";

dotenv.config();

// generate a token that is signed by azure key vault
export async function generateToken(clientId: string): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const tokenExpirySeconds = Number(process.env.TOKEN_EXPIRY) || 3600; // Default to 1 hour

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const body = {
    sub: clientId,
    iss: 'OAuthServer',
    scope: 'api.read',
    iat: nowInSeconds,
    exp: nowInSeconds + tokenExpirySeconds,
  };

  // base64 encode the header and body to form the token before signature
  const encodedHeader = base64url.encode(JSON.stringify(header));
  const encodedBody = base64url.encode(JSON.stringify(body));
  const tokenBeforeSignature = `${encodedHeader}.${encodedBody}`;

  // sign using azure key vault
  let signature: string;
  try {
    signature = await signJwtWithKeyVault(tokenBeforeSignature);
  } catch (error) {
    throw new Error(`Error signing JWT: ${error}`);
  }

  // combine token and signature to form conplete JWT
  return `${tokenBeforeSignature}.${signature}`;
}
