import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../config/prisma'

const router = Router()

router.use(requireAuth)

// RF-16: Registrar visita a la página educativa
router.post('/learn', async (req, res, next) => {
  try {
    const userId = req.user!.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { zoneId: true },
    })

    await prisma.learnVisit.create({
      data: { userId, zoneId: user?.zoneId ?? null },
    })

    res.json({ success: true, data: null, message: 'Visita registrada' })
  } catch (err) {
    next(err)
  }
})

export default router
