import { z } from 'zod'

export const createVehicleSchema = z.object({
  plate: z
    .string()
    .min(5, 'Placa inválida')
    .max(10)
    .trim()
    .transform((v) => v.toUpperCase()),
  type: z.enum(['COMPACTOR', 'OPEN_TRUCK', 'MINI_TRUCK']),
  brand: z.string().max(50).trim().optional(),
  model: z.string().max(50).trim().optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  capacity: z.number().positive().optional(),
})

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'IN_ROUTE', 'MAINTENANCE', 'INACTIVE']).optional(),
  isActive: z.boolean().optional(),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
