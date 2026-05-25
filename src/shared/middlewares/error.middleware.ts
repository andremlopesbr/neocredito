import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ZodError } from 'zod';

/**
 * Middleware global de tratamento de erros.
 * Intercepta qualquer exceção e formata a resposta no padrão JSON do desafio.
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Caso o erro seja uma instância do erro personalizado da aplicação (AppError)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
    return;
  }

  // Caso seja um erro de validação estrutural do Zod
  if (error instanceof ZodError) {
    const details = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    
    res.status(400).json({
      error: 'Erro de validação nos dados fornecidos.',
      details,
    });
    return;
  }

  // Caso ocorra um erro de sintaxe do JSON (ex: payload quebrado)
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    res.status(400).json({
      error: 'Corpo da requisição JSON inválido.',
    });
    return;
  }

  // Erro interno não esperado (HTTP 500)
  console.error('[Internal Error]:', error);
  
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
