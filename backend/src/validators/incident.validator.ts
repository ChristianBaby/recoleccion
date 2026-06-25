import { z } from 'zod'

export const createIncidentSchema = z.object({
  type: z.enum([
    'WASTE_ACCUMULATION',
    'DAMAGED_CONTAINER',
    'MISSED_COLLECTION',
    'OTHER',
  ]),
  description: z
    .string()
    .min(10, 'Describa el problema con al menos 10 caracteres')
    .max(1000)
    .trim(),
  imageUrl: z.string().url('URL de imagen inválida').optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  address: z.string().max(300).trim().optional(),
})

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']),
})

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>

export const updateIncidentSchema = z.object({
  type: z.enum([
    'WASTE_ACCUMULATION',
    'DAMAGED_CONTAINER',
    'MISSED_COLLECTION',
    'OTHER',
  ]).optional(),
  description: z
    .string()
    .min(10, 'Describa el problema con al menos 10 caracteres')
    .max(1000)
    .trim()
    .optional(),
  imageUrl: z.string().url('URL de imagen inválida').nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  address: z.string().max(300).trim().nullable().optional(),
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
})

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>

