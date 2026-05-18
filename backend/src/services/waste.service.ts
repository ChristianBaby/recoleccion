import { prisma } from '../config/prisma'
import type { CreateWasteTypeInput, UpdateWasteTypeInput } from '../validators/waste.validator'

// ─── RF-05: Listar tipos de residuos ─────────────────────────────────────────

export async function listWasteTypes(onlyActive = false) {
  return prisma.wasteType.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
}

// ─── RF-05: Obtener tipo de residuo ──────────────────────────────────────────

export async function getWasteType(id: string) {
  const wt = await prisma.wasteType.findUnique({ where: { id } })
  if (!wt) throw { status: 404, message: 'Tipo de residuo no encontrado' }
  return wt
}

// ─── RF-05: Crear tipo de residuo ─────────────────────────────────────────────

export async function createWasteType(input: CreateWasteTypeInput) {
  const exists = await prisma.wasteType.findUnique({ where: { name: input.name } })
  if (exists) throw { status: 409, message: 'Ya existe un tipo de residuo con ese nombre' }

  return prisma.wasteType.create({ data: input })
}

// ─── RF-05: Actualizar tipo de residuo ────────────────────────────────────────

export async function updateWasteType(id: string, input: UpdateWasteTypeInput) {
  const wt = await prisma.wasteType.findUnique({ where: { id } })
  if (!wt) throw { status: 404, message: 'Tipo de residuo no encontrado' }

  if (input.name && input.name !== wt.name) {
    const exists = await prisma.wasteType.findUnique({ where: { name: input.name } })
    if (exists) throw { status: 409, message: 'Ya existe un tipo de residuo con ese nombre' }
  }

  return prisma.wasteType.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.colorCode !== undefined && { colorCode: input.colorCode }),
      ...(input.examples !== undefined && { examples: input.examples }),
      ...(input.instructions !== undefined && { instructions: input.instructions }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  })
}

// ─── RF-05: Activar / Desactivar ──────────────────────────────────────────────

export async function toggleWasteTypeStatus(id: string) {
  const wt = await prisma.wasteType.findUnique({ where: { id } })
  if (!wt) throw { status: 404, message: 'Tipo de residuo no encontrado' }

  return prisma.wasteType.update({
    where: { id },
    data: { isActive: !wt.isActive },
  })
}
