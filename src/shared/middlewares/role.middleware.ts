import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Middleware para restrição de rotas com base no perfil do usuário (RBAC).
 * Permite apenas usuários que possuam um dos perfis listados.
 */
export function roleMiddleware(perfisPermitidos: ('CORBAN' | 'OPERADOR')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    if (!perfisPermitidos.includes(req.user.perfil)) {
      throw new AppError(
        `Acesso negado para o perfil '${req.user.perfil}'.`,
        403
      );
    }

    next();
  };
}
