import { prisma } from '../config/prisma'
import { pointInPolygon } from '../utils/geoUtils'
import type { CreateZoneInput, UpdateZoneInput } from '../validators/zone.validator'

// ─── RF-03: Listar zonas ──────────────────────────────────────────────────────

export async function listZones() {
  return prisma.zone.findMany({
    include: {
      _count: { select: { users: true, routes: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── RF-03: Obtener zona ──────────────────────────────────────────────────────

export async function getZone(id: string) {
  const zone = await prisma.zone.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, routes: true } },
      routes: { select: { id: true, name: true, status: true } },
    },
  })
  if (!zone) throw { status: 404, message: 'Zona no encontrada' }
  return zone
}

// ─── RF-03: Crear zona ────────────────────────────────────────────────────────

export async function createZone(input: CreateZoneInput, adminId: string) {
  const exists = await prisma.zone.findUnique({ where: { name: input.name } })
  if (exists) throw { status: 409, message: 'Ya existe una zona con ese nombre' }

  return prisma.zone.create({
    data: {
      name: input.name,
      description: input.description,
      district: input.district,
      color: input.color ?? '#22c55e',
      geometry: input.geometry,
      createdById: adminId,
    },
  })
}

// ─── RF-03: Actualizar zona ───────────────────────────────────────────────────

export async function updateZone(id: string, input: UpdateZoneInput) {
  const zone = await prisma.zone.findUnique({ where: { id } })
  if (!zone) throw { status: 404, message: 'Zona no encontrada' }

  if (input.name && input.name !== zone.name) {
    const exists = await prisma.zone.findUnique({ where: { name: input.name } })
    if (exists) throw { status: 409, message: 'Ya existe una zona con ese nombre' }
  }

  return prisma.zone.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.district !== undefined && { district: input.district }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.geometry !== undefined && { geometry: input.geometry }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  })
}

// ─── RF-04: Detectar zona por coordenadas GPS ─────────────────────────────────

export async function detectZoneByCoords(lat: number, lng: number) {
  const zones = await prisma.zone.findMany({ where: { isActive: true } })

  for (const zone of zones) {
    const geo = zone.geometry as { coordinates: [number, number][][] }
    const ring = geo.coordinates[0]
    if (pointInPolygon(lat, lng, ring)) {
      return zone
    }
  }
  return null
}

// ─── RF-04: Asignar zona al usuario actual ────────────────────────────────────

export async function assignZoneToUser(userId: string, lat: number, lng: number) {
  const zone = await detectZoneByCoords(lat, lng)

  await prisma.user.update({
    where: { id: userId },
    data: { zoneId: zone?.id ?? null },
  })

  return zone
}

// ─── RF-03: Activar / Desactivar zona ────────────────────────────────────────

export async function toggleZoneStatus(id: string) {
  const zone = await prisma.zone.findUnique({ where: { id } })
  if (!zone) throw { status: 404, message: 'Zona no encontrada' }

  return prisma.zone.update({
    where: { id },
    data: { isActive: !zone.isActive },
  })
}
