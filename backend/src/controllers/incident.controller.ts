import { Request, Response, NextFunction } from 'express'
import * as incidentService from '../services/incident.service'
import { ok, created } from '../utils/response'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const status  = req.query['status']  as string | undefined
    const zoneId  = req.query['zoneId']  as string | undefined
    const incidents = await incidentService.listIncidents(
      req.user!.id,
      req.user!.role,
      { status, zoneId },
    )
    ok(res, incidents)
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.getIncident(
      req.params['id'] as string,
      req.user!.id,
      req.user!.role,
    )
    ok(res, incident)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.createIncident(req.body, req.user!.id)
    created(res, incident, `Incidencia registrada. Código de seguimiento: ${incident.trackingCode}`)
  } catch (err) {
    next(err)
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.updateIncidentStatus(
      req.params['id'] as string,
      req.body,
    )
    ok(res, incident, 'Estado actualizado exitosamente')
  } catch (err) {
    next(err)
  }
}

export async function track(req: Request, res: Response, next: NextFunction) {
  try {
    const incident = await incidentService.getByTrackingCode(
      req.params['code'] as string,
      req.user!.id,
      req.user!.role,
    )
    ok(res, incident)
  } catch (err) {
    next(err)
  }
}
