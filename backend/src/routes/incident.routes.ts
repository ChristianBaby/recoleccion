import { Router } from 'express'
import { validate } from '../middleware/validate'
import { requireAuth, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/incident.controller'
import { createIncidentSchema, updateIncidentStatusSchema, updateIncidentSchema } from '../validators/incident.validator'

const router = Router()

router.use(requireAuth)

// RF-11: Listar y crear incidencias
router.get('/', ctrl.list)
router.post('/', validate(createIncidentSchema), ctrl.create)

// RF-11: Consulta por código de seguimiento
router.get('/track/:code', ctrl.track)

// RF-11: Ver incidencia por ID
router.get('/:id', ctrl.getById)

// RF-11: Editar campos o estado de la incidencia (ADMIN, OPERATOR o el propio ciudadano)
router.patch('/:id', validate(updateIncidentSchema), ctrl.update)

// RF-11: Eliminar incidencia
router.delete('/:id', ctrl.remove)

// RF-11: ADMIN u OPERATOR pueden cambiar el estado directamente
router.patch('/:id/status', requireRole('ADMIN', 'OPERATOR'), validate(updateIncidentStatusSchema), ctrl.updateStatus)

export default router
