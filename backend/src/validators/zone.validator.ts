import { z } from 'zod'

const coordinateSchema = z.tuple([z.number().finite(), z.number().finite()])

export const createZoneSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  district: z.string().min(2, 'Seleccione un distrito').trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido').optional(),
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z
      .array(z.array(coordinateSchema).min(4, 'El polígono debe tener al menos 4 puntos'))
      .min(1),
  }),
})

export const updateZoneSchema = createZoneSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateZoneInput = z.infer<typeof createZoneSchema>
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>
