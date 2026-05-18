import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/report.controller'

const router = Router()

router.use(requireAuth)
router.use(requireRole('ADMIN'))

// RF-14: Residuos recolectados por zona
router.get('/waste-by-zone', ctrl.wasteByZone)

// RF-15: Cumplimiento de rutas
router.get('/route-compliance', ctrl.routeCompliance)

// RF-16: Participación ciudadana
router.get('/citizen-participation', ctrl.citizenParticipation)

export default router
