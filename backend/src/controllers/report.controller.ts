import { Request, Response } from 'express'
import * as svc from '../services/report.service'

export async function wasteByZone(req: Request, res: Response) {
  try {
    const { from, to, zoneId } = req.query as Record<string, string>
    const data = await svc.getWasteByZone({ from, to, zoneId })
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Error al generar reporte de residuos' })
  }
}

export async function routeCompliance(req: Request, res: Response) {
  try {
    const { from, to, zoneId } = req.query as Record<string, string>
    const data = await svc.getRouteCompliance({ from, to, zoneId })
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Error al generar reporte de cumplimiento' })
  }
}

export async function citizenParticipation(req: Request, res: Response) {
  try {
    const { from, to, zoneId } = req.query as Record<string, string>
    const data = await svc.getCitizenParticipation({ from, to, zoneId })
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Error al generar reporte de participación' })
  }
}
