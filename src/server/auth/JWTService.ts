import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: string;
  username: string;
  role: string;
  name: string;
  email?: string;
}

export class JWTService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'sunshine_erp_jwt_secret_key_2026';
  private static readonly JWT_EXPIRES_IN = '24h';

  public static signToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  public static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  }
}
