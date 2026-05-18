import { Router } from 'express'
import { validate } from '../middleware/validate'
import { requireAuth, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/incident.controller'
import { createIncidentSchema, updateIncidentStatusSchema } from '../validators/incident.validator'

const router = Router()

router.use(requireAuth)

// RF-11: Listar y crear incidencias
router.get('/', ctrl.list)
router.post('/', validate(createIncidentSchema), ctrl.create)

// RF-11: Consulta por código de seguimiento
router.get('/track/:code', ctrl.track)

// RF-11: Ver incidencia por ID
router.get('/:id', ctrl.getById)

// RF-11: Solo ADMIN puede cambiar el estado
router.patch('/:id/status', requireRole('ADMIN'), validate(updateIncidentStatusSchema), ctrl.updateStatus)

export default router
