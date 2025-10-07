
import { Router, Request, Response } from "express";
import { generateToken } from "../utils/jwt";

const router: Router = Router();

interface TokenRequestBody {
  client_id: string;
  client_secret: string;
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
  (req: Request<{}, {}, TokenRequestBody>, res: Response<TokenResponse | ErrorResponse>) => {
    const { client_id, client_secret, grant_type } = req.body;

    // validate grant type
    if (grant_type !== "client_credentials") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    // validate client
    // TODO: Use poper credential store
    console.log(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
    if (
      client_id !== process.env.CLIENT_ID ||
      client_secret !== process.env.CLIENT_SECRET
    ) {
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

