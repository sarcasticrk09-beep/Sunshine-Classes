import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from './JWTService';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && (req.cookies.sunshine_access_token || req.cookies.sunshine_token)) {
    token = req.cookies.sunshine_access_token || req.cookies.sunshine_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
  }

  const payload = JWTService.verifyAccessToken(token) || JWTService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired access token.' });
  }

  req.user = payload;
  next();
}
