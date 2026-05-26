import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/AppError';
import { LoginDTO } from './auth.dto';

interface LoginResult {
  token: string;
  usuario: {
    id: string;
    email: string;
    perfil: 'CORBAN' | 'OPERADOR';
    corbanId: string | null;
  };
}

export class AuthService {
  /**
   * Realiza a autenticação do usuário e gera o token JWT.
   */
  public async login(data: LoginDTO): Promise<LoginResult> {
    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (!usuario) {
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    // Compara a senha informada com o hash salvo no banco de dados
    const senhaValida = await bcrypt.compare(data.senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    const secret = process.env.JWT_SECRET || 'super-secret-key-neo-credito-2026-development-only';
    const expires = (process.env.JWT_EXPIRES_IN as any) || '8h';

    // Payload do JWT: { sub, perfil, corbanId? }
    const token = jwt.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
        corbanId: usuario.corbanId,
      },
      secret,
      { expiresIn: expires }
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil as 'CORBAN' | 'OPERADOR',
        corbanId: usuario.corbanId,
      },
    };
  }

  /**
   * Busca e retorna as informações do usuário autenticado.
   */
  public async obterUsuarioLogado(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        perfil: true,
        corbanId: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return usuario;
  }
}
