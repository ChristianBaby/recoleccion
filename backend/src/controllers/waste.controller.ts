import { Request, Response, NextFunction } from 'express'
import * as wasteService from '../services/waste.service'
import { ok, created } from '../utils/response'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Usuarios no-admin solo ven tipos activos
    const onlyActive = req.user?.role !== 'ADMIN'
    const items = await wasteService.listWasteTypes(onlyActive)
    ok(res, items)
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await wasteService.getWasteType(req.params['id'] as string)
    ok(res, item)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await wasteService.createWasteType(req.body)
    created(res, item, 'Tipo de residuo registrado exitosamente')
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await wasteService.updateWasteType(req.params['id'] as string, req.body)
    ok(res, item, 'Tipo de residuo actualizado exitosamente')
  } catch (err) {
    next(err)
  }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await wasteService.toggleWasteTypeStatus(req.params['id'] as string)
    ok(res, item, item.isActive ? 'Tipo de residuo habilitado' : 'Tipo de residuo deshabilitado')
  } catch (err) {
    next(err)
  }
}
