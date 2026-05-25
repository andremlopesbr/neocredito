/**
 * Classe de erro customizada para o domínio da aplicação.
 * Permite definir códigos de status HTTP específicos.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
