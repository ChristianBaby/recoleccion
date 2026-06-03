import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/user.controller'

const router = Router()

router.use(requireAuth)
router.use(requireRole('ADMIN'))

router.get('/', ctrl.list)
router.patch('/:id/assign-zone', ctrl.assignZone)

export default router
