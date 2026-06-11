import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/user.controller'

const router = Router()

router.use(requireAuth)
router.use(requireRole('ADMIN'))

router.get('/', ctrl.list)
router.post('/', ctrl.createStaff)
router.patch('/:id/assign-zone', ctrl.assignZone)
router.patch('/:id/toggle-active', ctrl.toggleActive)

export default router
