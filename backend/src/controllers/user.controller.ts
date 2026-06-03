import { Request, Response, NextFunction } from 'express'
import * as userService from '../services/user.service'
import { ok } from '../utils/response'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, hasZone } = req.query
    const filters: { role?: string; hasZone?: boolean } = {}
    if (typeof role === 'string') filters.role = role
    if (hasZone === 'true') filters.hasZone = true
    if (hasZone === 'false') filters.hasZone = false
    const users = await userService.listUsers(filters)
    ok(res, users)
  } catch (err) {
    next(err)
  }
}

export async function assignZone(req: Request, res: Response, next: NextFunction) {
  try {
    const { zoneId } = req.body as { zoneId: string | null }
    const user = await userService.assignZone(req.params['id'] as string, zoneId ?? null)
    ok(res, user, zoneId ? 'Zona asignada correctamente' : 'Zona removida')
  } catch (err) {
    next(err)
  }
}
