import { prisma } from '../config/prisma'
import type { CreateIncidentInput, UpdateIncidentStatusInput } from '../validators/incident.validator'

// ─── RF-11: Listar incidencias ────────────────────────────────────────────────

export async function listIncidents(
  userId: string,
  role: string,
  filters?: { status?: string },
) {
  const isAdmin = role === 'ADMIN'
  return prisma.incident.findMany({
    where: {
      // Ciudadanos solo ven sus propias incidencias
      ...(!isAdmin && { citizenId: userId }),
      ...(filters?.status && { status: filters.status as any }),
    },
    include: {
      citizen: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── RF-11: Obtener incidencia ────────────────────────────────────────────────

export async function getIncident(id: string, userId: string, role: string) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      citizen: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!incident) throw { status: 404, message: 'Incidencia no encontrada' }

  // Ciudadanos solo pueden ver sus propias incidencias
  if (role !== 'ADMIN' && incident.citizenId !== userId) {
    throw { status: 403, message: 'No tienes permiso para ver esta incidencia' }
  }

  return incident
}

// ─── RF-11: Crear incidencia ──────────────────────────────────────────────────

export async function createIncident(input: CreateIncidentInput, citizenId: string) {
  return prisma.incident.create({
    data: {
      type: input.type,
      description: input.description,
      imageUrl: input.imageUrl ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      address: input.address ?? null,
      citizenId,
    },
    select: {
      id: true,
      type: true,
      description: true,
      status: true,
      trackingCode: true,
      lat: true,
      lng: true,
      address: true,
      createdAt: true,
    },
  })
}

// ─── RF-11: Actualizar estado (solo ADMIN) ────────────────────────────────────

export async function updateIncidentStatus(
  id: string,
  input: UpdateIncidentStatusInput,
) {
  const incident = await prisma.incident.findUnique({ where: { id } })
  if (!incident) throw { status: 404, message: 'Incidencia no encontrada' }

  return prisma.incident.update({
    where: { id },
    data: { status: input.status },
  })
}

// ─── RF-11: Buscar por código de seguimiento ──────────────────────────────────

export async function getByTrackingCode(code: string, userId: string, role: string) {
  const incident = await prisma.incident.findUnique({
    where: { trackingCode: code },
    include: {
      citizen: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!incident) throw { status: 404, message: 'Código de seguimiento inválido' }

  if (role !== 'ADMIN' && incident.citizenId !== userId) {
    throw { status: 403, message: 'No tienes acceso a esta incidencia' }
  }

  return incident
}
