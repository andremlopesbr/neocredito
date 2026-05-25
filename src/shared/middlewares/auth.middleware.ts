import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

interface TokenPayload {
  sub: string;
  email: string;
  perfil: 'CORBAN' | 'OPERADOR';
  corbanId?: string | null;
}

/**
 * Middleware para validar o token JWT e autenticar o usuário.
 * Injeta o payload do usuário autenticado no objeto de requisição (req.user).
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  // Espera-se o formato "Bearer <TOKEN>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    throw new AppError('Formato de token inválido. Use o padrão Bearer.', 401);
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    throw new AppError('Esquema de autenticação inválido. Use Bearer.', 401);
  }

  const secret = process.env.JWT_SECRET || 'super-secret-key-neo-credito-2026-development-only';

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      perfil: decoded.perfil,
      corbanId: decoded.corbanId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expirado', 401);
    }
    
    throw new AppError('Token de autenticação inválido ou corrompido.', 401);
  }
}
