import { prisma } from '../config/prisma'
import type { CreateRouteInput, UpdateRouteInput } from '../validators/route.validator'

// ─── RF-09: Listar rutas ──────────────────────────────────────────────────────

export async function listRoutes(filters?: { zoneId?: string; status?: string }) {
  return prisma.route.findMany({
    where: {
      ...(filters?.zoneId && { zoneId: filters.zoneId }),
      ...(filters?.status && { status: filters.status as any }),
    },
    include: {
      zone: { select: { id: true, name: true, color: true } },
      vehicle: { select: { id: true, plate: true, type: true } },
      operator: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { waypoints: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── RF-09: Obtener ruta ──────────────────────────────────────────────────────

export async function getRoute(id: string) {
  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      zone: { select: { id: true, name: true, color: true, district: true } },
      vehicle: { select: { id: true, plate: true, type: true, brand: true } },
      operator: { select: { id: true, firstName: true, lastName: true } },
      waypoints: { orderBy: { order: 'asc' } },
      routeWasteTypes: {
        include: {
          wasteType: { select: { id: true, name: true, category: true, colorCode: true } },
        },
      },
    },
  })
  if (!route) throw { status: 404, message: 'Ruta no encontrada' }
  return route
}

// ─── RF-09: Crear ruta ────────────────────────────────────────────────────────

export async function createRoute(input: CreateRouteInput, adminId: string) {
  const zone = await prisma.zone.findUnique({ where: { id: input.zoneId } })
  if (!zone) throw { status: 404, message: 'Zona no encontrada' }

  if (input.operatorId) {
    const operator = await prisma.user.findUnique({ where: { id: input.operatorId } })
    if (!operator || operator.role !== 'OPERATOR') {
      throw { status: 400, message: 'El operador seleccionado no es válido' }
    }
  }

  if (input.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } })
    if (!vehicle) throw { status: 404, message: 'Vehículo no encontrado' }
  }

  const { waypoints, wasteTypeIds, ...routeData } = input

  return prisma.$transaction(async (tx) => {
    const route = await tx.route.create({
      data: { ...routeData, createdById: adminId },
    })

    if (waypoints?.length) {
      await tx.waypoint.createMany({
        data: waypoints.map((wp) => ({ ...wp, routeId: route.id })),
      })
    }

    if (wasteTypeIds?.length) {
      await tx.routeWasteType.createMany({
        data: wasteTypeIds.map((wId) => ({ routeId: route.id, wasteTypeId: wId })),
      })
    }

    return tx.route.findUnique({
      where: { id: route.id },
      include: {
        zone: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true } },
        operator: { select: { id: true, firstName: true, lastName: true } },
        waypoints: { orderBy: { order: 'asc' } },
        routeWasteTypes: { include: { wasteType: { select: { id: true, name: true, category: true } } } },
      },
    })
  })
}

// ─── RF-09: Actualizar ruta ───────────────────────────────────────────────────

export async function updateRoute(id: string, input: UpdateRouteInput) {
  const route = await prisma.route.findUnique({ where: { id } })
  if (!route) throw { status: 404, message: 'Ruta no encontrada' }

  const { waypoints, wasteTypeIds, ...fields } = input

  return prisma.$transaction(async (tx) => {
    await tx.route.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.status !== undefined && { status: fields.status }),
        ...(fields.zoneId !== undefined && { zoneId: fields.zoneId }),
        ...(fields.vehicleId !== undefined && { vehicleId: fields.vehicleId }),
        ...(fields.operatorId !== undefined && { operatorId: fields.operatorId }),
        ...(fields.dayOfWeek !== undefined && { dayOfWeek: fields.dayOfWeek }),
        ...(fields.startTime !== undefined && { startTime: fields.startTime }),
        ...(fields.estimatedDuration !== undefined && { estimatedDuration: fields.estimatedDuration }),
      },
    })

    if (waypoints !== undefined) {
      await tx.waypoint.deleteMany({ where: { routeId: id } })
      if (waypoints.length) {
        await tx.waypoint.createMany({
          data: waypoints.map((wp) => ({ ...wp, routeId: id })),
        })
      }
    }

    if (wasteTypeIds !== undefined) {
      await tx.routeWasteType.deleteMany({ where: { routeId: id } })
      if (wasteTypeIds.length) {
        await tx.routeWasteType.createMany({
          data: wasteTypeIds.map((wId) => ({ routeId: id, wasteTypeId: wId })),
        })
      }
    }

    return tx.route.findUnique({
      where: { id },
      include: {
        zone: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true } },
        operator: { select: { id: true, firstName: true, lastName: true } },
        waypoints: { orderBy: { order: 'asc' } },
        routeWasteTypes: { include: { wasteType: { select: { id: true, name: true, category: true } } } },
      },
    })
  })
}

// ─── RF-09: Desactivar ruta ───────────────────────────────────────────────────

export async function deactivateRoute(id: string) {
  const route = await prisma.route.findUnique({ where: { id } })
  if (!route) throw { status: 404, message: 'Ruta no encontrada' }

  return prisma.route.update({
    where: { id },
    data: { status: 'INACTIVE' },
  })
}

// ─── Operadores disponibles (para dropdown en formulario de ruta) ─────────────

export async function listOperators() {
  return prisma.user.findMany({
    where: { role: 'OPERATOR', isActive: true },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: 'asc' },
  })
}
