import { Router } from 'express'
import authRoutes from './auth.routes'

const router = Router()

router.use('/auth', authRoutes)

// Aquí se agregarán las demás rutas conforme se implementen los RF restantes:
// router.use('/zones', zonesRoutes)        // RF-03, RF-04
// router.use('/waste-types', wasteRoutes)  // RF-05, RF-06
// router.use('/routes', routesRoutes)      // RF-07, RF-09
// router.use('/tracking', trackingRoutes)  // RF-08
// router.use('/incidents', incidentsRoutes)// RF-11
// router.use('/reports', reportsRoutes)    // RF-14, RF-15, RF-16

export default router
