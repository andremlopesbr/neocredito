import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema } from './auth.dto';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Endpoint POST /auth/login
   */
  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Valida o corpo da requisição usando o Zod
      const dadosValidados = loginSchema.parse(req.body);
      
      const resultado = await this.authService.login(dadosValidados);
      
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint GET /auth/me
   */
  public me = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // O usuário já está autenticado pelo middleware, pegamos o ID direto de req.user
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        res.status(401).json({ error: 'Usuário não autenticado.' });
        return;
      }

      const usuario = await this.authService.obterUsuarioLogado(usuarioId);
      
      res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  };
}
