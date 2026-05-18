import { Router } from 'express'
import { validate } from '../middleware/validate'
import { requireAuth, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/vehicle.controller'
import { createVehicleSchema, updateVehicleSchema } from '../validators/vehicle.validator'

const router = Router()

router.use(requireAuth)

router.get('/', ctrl.list)
router.post('/', requireRole('ADMIN'), validate(createVehicleSchema), ctrl.create)
router.put('/:id', requireRole('ADMIN'), validate(updateVehicleSchema), ctrl.update)

export default router
