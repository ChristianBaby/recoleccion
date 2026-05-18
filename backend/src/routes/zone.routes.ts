import { Router } from 'express'
import { validate } from '../middleware/validate'
import { requireAuth, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/zone.controller'
import { createZoneSchema, updateZoneSchema } from '../validators/zone.validator'

const router = Router()

router.use(requireAuth)

// RF-03: Cualquier usuario autenticado puede ver zonas
router.get('/', ctrl.list)
router.get('/:id', ctrl.getById)

// RF-03: Solo ADMIN puede crear/modificar zonas
router.post('/', requireRole('ADMIN'), validate(createZoneSchema), ctrl.create)
router.put('/:id', requireRole('ADMIN'), validate(updateZoneSchema), ctrl.update)
router.patch('/:id/toggle-status', requireRole('ADMIN'), ctrl.toggleStatus)

// RF-04: Detección y asignación de zona por GPS
router.post('/detect', ctrl.detect)
router.post('/assign-me', ctrl.assignMe)

export default router
