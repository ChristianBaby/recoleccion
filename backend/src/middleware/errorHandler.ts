import { Request, Response, NextFunction } from 'express'

interface AppError {
  status?: number
  message?: string
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err.status ?? 500
  const message = err.message ?? 'Error interno del servidor'
  res.status(status).json({ success: false, message })
}
