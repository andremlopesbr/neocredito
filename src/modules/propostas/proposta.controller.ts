import { Request, Response, NextFunction } from 'express';
import { PropostaService } from './proposta.service';
import { criarPropostaSchema, listarPropostasSchema, atualizarStatusSchema } from './proposta.dto';

export class PropostaController {
  private propostaService: PropostaService;

  constructor() {
    this.propostaService = new PropostaService();
  }

  /**
   * Endpoint POST /propostas
   */
  public criar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dadosValidados = criarPropostaSchema.parse(req.body);
      
      const proposta = await this.propostaService.criarProposta(dadosValidados, req.user);
      
      res.status(201).json(proposta);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint GET /propostas
   */
  public listar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filtrosValidados = listarPropostasSchema.parse(req.query);
      
      const resultado = await this.propostaService.listarPropostas(filtrosValidados, req.user);
      
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint GET /propostas/:id
   */
  public obterPorId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      
      const proposta = await this.propostaService.obterPropostaPorId(id, req.user);
      
      res.status(200).json(proposta);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint PATCH /propostas/:id/status
   */
  public atualizarStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dadosValidados = atualizarStatusSchema.parse(req.body);
      
      const proposta = await this.propostaService.atualizarStatus(
        id,
        dadosValidados.status,
        dadosValidados.motivoReprovacao,
        req.user
      );
      
      res.status(200).json(proposta);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint DELETE /propostas/:id
   */
  public cancelar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      
      const proposta = await this.propostaService.cancelarProposta(id, req.user);
      
      res.status(200).json(proposta);
    } catch (error) {
      next(error);
    }
  };
}
