import { Router, Request, Response } from "express";
import { generateToken } from "../utils/jwt";
import * as bcrypt from 'bcryptjs';
import { getClientSecretHash } from '../utils/db';

const router: Router = Router();

interface TokenRequestBody {
  client_id: string;
  client_password: string;
  grant_type: 'client_credentials';
}

interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: string | undefined;
}

interface ErrorResponse {
  error: string;
}

router.post(
  "/token",
  async (req: Request<{}, {}, TokenRequestBody>, res: Response<TokenResponse | ErrorResponse>) => {
    const { client_id, client_password, grant_type } = req.body;

    // validate grant type
    if (grant_type !== "client_credentials") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    // retrieve the hash from the database
    let storedClientHash;
    try {
        storedClientHash = await getClientSecretHash(client_id);
    } catch (e) {
        console.error("Token endpoint DB failure:", e);
        return res.status(500).json({ error: "server_error" });
    }

    // check if client ID exists
    if (!storedClientHash) {
        return res.status(401).json({ error: "invalid_client" });
    }

    // validate password
    let isSecretValid = false;
    try {
        isSecretValid = await bcrypt.compare(client_password, storedClientHash);
    } catch (e) {
        console.error("Bcrypt comparison failed:", e);
    }
    
    if (!isSecretValid) {
      return res.status(401).json({ error: "invalid_client" });
    }

    // generate and send token
    const token = generateToken(client_id);
    res.json({
      access_token: token,
      token_type: "Bearer",
      expires_in: process.env.TOKEN_EXPIRY
    });
  }
);

export default router;
