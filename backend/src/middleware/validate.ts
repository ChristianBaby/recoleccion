import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { badRequest } from '../utils/response'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      badRequest(res, 'Datos inválidos', errors)
      return
    }
    req.body = result.data
    next()
  }
}
