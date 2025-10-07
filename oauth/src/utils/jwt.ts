import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();

export function generateToken(clientId: string): string {
  return jwt.sign(
    { sub: clientId, iss: 'OAuthServer', scope: 'api.read' },
    process.env.JWT_SECRET as string,
    { expiresIn: Number(process.env.TOKEN_EXPIRY) }
  );
}

