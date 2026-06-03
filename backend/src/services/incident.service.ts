import { prisma } from '../config/prisma'
import type { CreateIncidentInput, UpdateIncidentStatusInput } from '../validators/incident.validator'
import { sendIncidentStatusEmail } from './email.service'

// ─── RF-11: Listar incidencias ────────────────────────────────────────────────

export async function listIncidents(
  userId: string,
  role: string,
  filters?: { status?: string; zoneId?: string },
) {
  const isAdmin = role === 'ADMIN'

  if (isAdmin) {
    return prisma.incident.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.zoneId && { citizen: { zoneId: filters.zoneId } }),
      },
      include: {
        citizen: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Ciudadano/Operador: ver todas las incidencias de su zona
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { zoneId: true } })
  if (!me?.zoneId) return [] // Sin zona = sin incidencias

  return prisma.incident.findMany({
    where: {
      citizen: { zoneId: me.zoneId },
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
  const citizen = await prisma.user.findUnique({ where: { id: citizenId }, select: { zoneId: true } })
  if (!citizen?.zoneId) {
    throw { status: 403, message: 'Debes tener una zona asignada para reportar incidencias' }
  }

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
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: { citizen: { select: { email: true, firstName: true } } },
  })
  if (!incident) throw { status: 404, message: 'Incidencia no encontrada' }

  const updated = await prisma.incident.update({
    where: { id },
    data: { status: input.status },
  })

  // Notificar al ciudadano por email
  try {
    await sendIncidentStatusEmail(
      incident.citizen.email,
      incident.citizen.firstName,
      incident.trackingCode,
      input.status,
    )
  } catch (err) {
    console.error('Error enviando notificación de incidencia:', err)
  }

  return updated
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
