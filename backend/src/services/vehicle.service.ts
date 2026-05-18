import { prisma } from '../config/prisma'
import type { CreateVehicleInput, UpdateVehicleInput } from '../validators/vehicle.validator'

export async function listVehicles() {
  return prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function createVehicle(input: CreateVehicleInput) {
  const exists = await prisma.vehicle.findUnique({ where: { plate: input.plate } })
  if (exists) throw { status: 409, message: 'Ya existe un vehículo con esa placa' }
  return prisma.vehicle.create({ data: input })
}

export async function updateVehicle(id: string, input: UpdateVehicleInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } })
  if (!vehicle) throw { status: 404, message: 'Vehículo no encontrado' }

  if (input.plate && input.plate !== vehicle.plate) {
    const exists = await prisma.vehicle.findUnique({ where: { plate: input.plate } })
    if (exists) throw { status: 409, message: 'Ya existe un vehículo con esa placa' }
  }

  return prisma.vehicle.update({
    where: { id },
    data: {
      ...(input.plate !== undefined && { plate: input.plate }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.brand !== undefined && { brand: input.brand }),
      ...(input.model !== undefined && { model: input.model }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.capacity !== undefined && { capacity: input.capacity }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  })
}
