import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { DefaultAzureCredential } from "@azure/identity";
import base64url from "base64url";
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const KEY_VAULT_URL = process.env.AZURE_KEY_VAULT_URL;
const KEY_NAME = process.env.AZURE_KEY_NAME;

if (!KEY_VAULT_URL || !KEY_NAME) {
  throw new Error("Need to configure KEY_VAULT_URL and KEY_NAME");
}

const credential = new DefaultAzureCredential();
const keyClient = new KeyClient(KEY_VAULT_URL, credential);
let cryptoClient: CryptographyClient;

export async function initializeKeyVaultClient(): Promise<void> {
  try {
    const key = await keyClient.getKey(KEY_NAME!);
    if (!key.id) {
      throw new Error(`Key ${KEY_NAME} fetched from Key Vault does not have a valid ID.`);
    }
    cryptoClient = new CryptographyClient(key.id, credential);
  } catch (error: any) {
    console.error("Key Vault initialization failed:", error);
  }
}

export async function signJwtWithKeyVault(tokenBeforeSignature: string): Promise<string> {
  if (!cryptoClient) throw new Error("Key Vault client is not initialized");
  try {
    // key vault expects a SHA-256 hash for RS256 signing
    const hash = crypto.createHash('sha256').update(tokenBeforeSignature, 'utf8').digest();

    const signResult = await cryptoClient.sign("RS256", hash);
    return base64url.encode(Buffer.from(signResult.result));
  } catch (err: any) {
    console.error("JWT signing failed:", err.message || err);
    throw err;
  }
}

export const keyVaultInitializationPromise = initializeKeyVaultClient();
