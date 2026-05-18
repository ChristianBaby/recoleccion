import { Request, Response, NextFunction } from 'express'
import * as vehicleService from '../services/vehicle.service'
import { ok, created } from '../utils/response'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicles = await vehicleService.listVehicles()
    ok(res, vehicles)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicle = await vehicleService.createVehicle(req.body)
    created(res, vehicle, 'Vehículo registrado exitosamente')
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params['id'] as string, req.body)
    ok(res, vehicle, 'Vehículo actualizado exitosamente')
  } catch (err) {
    next(err)
  }
}
