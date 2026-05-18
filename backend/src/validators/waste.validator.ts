import { z } from 'zod'

export const createWasteTypeSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100).trim(),
  category: z.enum(['ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS']),
  description: z.string().max(500).trim().optional(),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido'),
  examples: z
    .array(z.string().min(1).max(100).trim())
    .min(1, 'Ingresa al menos un ejemplo'),
  instructions: z.string().max(1000).trim().optional(),
})

export const updateWasteTypeSchema = createWasteTypeSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateWasteTypeInput = z.infer<typeof createWasteTypeSchema>
export type UpdateWasteTypeInput = z.infer<typeof updateWasteTypeSchema>
