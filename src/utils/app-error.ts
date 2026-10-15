// Esta clase es para lanzar errores de negocio de forma estructurada con códigos HTTP
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}