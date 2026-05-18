import { Router } from 'express'
import { validate } from '../middleware/validate'
import { requireAuth, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/waste.controller'
import { createWasteTypeSchema, updateWasteTypeSchema } from '../validators/waste.validator'

const router = Router()

router.use(requireAuth)

// RF-06: Todos los usuarios autenticados pueden ver el catálogo
router.get('/', ctrl.list)
router.get('/:id', ctrl.getById)

// RF-05: Solo ADMIN puede crear/modificar
router.post('/', requireRole('ADMIN'), validate(createWasteTypeSchema), ctrl.create)
router.put('/:id', requireRole('ADMIN'), validate(updateWasteTypeSchema), ctrl.update)
router.patch('/:id/toggle-status', requireRole('ADMIN'), ctrl.toggleStatus)

export default router
