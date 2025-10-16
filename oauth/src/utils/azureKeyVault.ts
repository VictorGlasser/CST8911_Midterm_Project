import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { DefaultAzureCredential } from "@azure/identity";
import base64url from "base64url";
import * as crypto from 'crypto';

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
  } catch (error) {
    throw new Error("Key Vault initialization failed");
  }
}

// sign the JWT using azure key vault
export async function signJwtWithKeyVault(tokenBeforeSignature: string): Promise<string> {
  // RS256 requires hashing the data first
  const hash = crypto.createHash("sha256").update(tokenBeforeSignature).digest();

  // sign the hash
  if (!cryptoClient) {
    throw new Error("Key vault client is not initialized");
  }

  const signResult = await cryptoClient.sign("RS256", hash);

  // JWT is in base64, so the signature must be encoded
  const signatureBase64Url = base64url.encode(Buffer.from(signResult.result));

  return signatureBase64Url;
}

export const keyVaultInitializationPromise = initializeKeyVaultClient();
