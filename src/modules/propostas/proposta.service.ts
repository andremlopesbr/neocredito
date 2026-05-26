import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/AppError';
import { STATUS, validarTransicaoStatus } from '../../shared/helpers/maquinaEstado';
import { calcularPropostaFinanceira } from '../../shared/helpers/calculadora';
import { limparCpf } from '../../shared/helpers/validadorCpf';
import { CriarPropostaDTO, ListarPropostasDTO } from './proposta.dto';

export class PropostaService {
  /**
   * Cria uma nova proposta com status inicial RASCUNHO e calcula os valores automáticos.
   */
  public async criarProposta(data: CriarPropostaDTO, usuarioLogado: any) {
    const cpfLimpo = limparCpf(data.clienteCpf);

    // Calculo automático da taxa de juros, valor da parcela e total a pagar
    const calculo = calcularPropostaFinanceira(data.valorSolicitado, data.numeroParcelas);

    // Se o ator for um CORBAN, a proposta é criada para o corbanId dele
    // Se for OPERADOR, é criada em nome dele, mas ele pode gerenciar todas.
    const proposta = await prisma.proposta.create({
      data: {
        clienteNome: data.clienteNome,
        clienteCpf: cpfLimpo,
        clienteRenda: data.clienteRenda,
        valorSolicitado: data.valorSolicitado,
        numeroParcelas: data.numeroParcelas,
        taxaJuros: calculo.taxaJuros,
        valorParcela: calculo.valorParcela,
        totalAPagar: calculo.totalAPagar,
        status: STATUS.RASCUNHO,
        criadoPorId: usuarioLogado.id,
      },
    });

    return proposta;
  }

  /**
   * Lista propostas com paginação, filtros e restrição de isolamento (Multi-tenant CORBAN).
   */
  public async listarPropostas(filtros: ListarPropostasDTO, usuarioLogado: any) {
    const { page, limit, status, cpf } = filtros;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filtros de CPF e Status
    if (status) {
      where.status = status;
    }
    if (cpf) {
      where.clienteCpf = cpf;
    }

    // Regra: CORBAN só lista propostas criadas por usuários do mesmo corbanId
    if (usuarioLogado.perfil === 'CORBAN') {
      where.criadoPor = {
        corbanId: usuarioLogado.corbanId,
      };
    }

    // Busca registros paginados ordenados pela data de criação decrescente
    const [propostas, total] = await prisma.$transaction([
      prisma.proposta.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.proposta.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / limit);

    return {
      dados: propostas,
      paginacao: {
        total,
        pagina: page,
        limite: limit,
        totalPaginas,
      },
    };
  }

  /**
   * Consulta uma proposta detalhada por ID respeitando isolamento de acesso.
   */
  public async obterPropostaPorId(id: string, usuarioLogado: any) {
    const proposta = await prisma.proposta.findUnique({
      where: { id },
      include: {
        criadoPor: {
          select: {
            id: true,
            email: true,
            perfil: true,
            corbanId: true,
          },
        },
      },
    });

    if (!proposta) {
      throw new AppError('Proposta não encontrada.', 404);
    }

    // Regra: Se for CORBAN, só acessa se a proposta for do mesmo corbanId
    if (usuarioLogado.perfil === 'CORBAN') {
      if (proposta.criadoPor.corbanId !== usuarioLogado.corbanId) {
        // Retorna HTTP 403 (e não 404)
        throw new AppError('Acesso não autorizado a esta proposta.', 403);
      }
    }

    // Remove a propriedade criadoPor da resposta para manter a padronização do modelo
    const { criadoPor, ...propostaFormatada } = proposta;

    return propostaFormatada;
  }

  /**
   * Atualiza o status da proposta respeitando a máquina de estados e regras.
   */
  public async atualizarStatus(id: string, novoStatus: string, motivoReprovacao: string | undefined, usuarioLogado: any) {
    // Regra: CORBAN não pode atualizar status via PATCH
    if (usuarioLogado.perfil !== 'OPERADOR') {
      throw new AppError('Ação permitida apenas para operadores internos.', 403);
    }

    const proposta = await prisma.proposta.findUnique({
      where: { id },
    });

    if (!proposta) {
      throw new AppError('Proposta não encontrada.', 404);
    }

    // Valida a transição usando a Máquina de Estados (retorna HTTP 422 se inválida)
    try {
      validarTransicaoStatus(proposta.status, novoStatus);
    } catch (error: any) {
      throw new AppError(error.message, 422);
    }

    // Validação: motivoReprovacao é obrigatório quando status = REPROVADA
    if (novoStatus === STATUS.REPROVADA && (!motivoReprovacao || motivoReprovacao.trim() === '')) {
      throw new AppError('O motivo de reprovação é obrigatório quando o status é REPROVADA.', 400);
    }

    const propostaAtualizada = await prisma.proposta.update({
      where: { id },
      data: {
        status: novoStatus,
        motivoReprovacao: novoStatus === STATUS.REPROVADA ? motivoReprovacao : null,
      },
    });

    return propostaAtualizada;
  }

  /**
   * Realiza o cancelamento (Soft Delete) da proposta.
   */
  public async cancelarProposta(id: string, usuarioLogado: any) {
    const proposta = await prisma.proposta.findUnique({
      where: { id },
      include: {
        criadoPor: {
          select: {
            corbanId: true,
          },
        },
      },
    });

    if (!proposta) {
      throw new AppError('Proposta não encontrada.', 404);
    }

    // Regras de acesso e status de cancelamento
    if (usuarioLogado.perfil === 'CORBAN') {
      // CORBAN só cancela se a proposta for de seu próprio corbanId
      if (proposta.criadoPor.corbanId !== usuarioLogado.corbanId) {
        throw new AppError('Acesso não autorizado a esta proposta.', 403);
      }
      // CORBAN só cancela propostas no status RASCUNHO
      if (proposta.status !== STATUS.RASCUNHO) {
        throw new AppError('Correspondentes bancários só podem cancelar propostas que estejam em RASCUNHO.', 403);
      }
    }

    // Valida a transição para CANCELADA pela máquina de estados (ex: não cancela se for APROVADA)
    try {
      validarTransicaoStatus(proposta.status, STATUS.CANCELADA);
    } catch (error: any) {
      throw new AppError(error.message, 422);
    }

    // Soft delete: A proposta permanece na base de dados com status CANCELADA
    const propostaCancelada = await prisma.proposta.update({
      where: { id },
      data: {
        status: STATUS.CANCELADA,
      },
    });

    return propostaCancelada;
  }
}
