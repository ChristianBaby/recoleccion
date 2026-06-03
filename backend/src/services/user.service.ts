import { prisma } from '../config/prisma'
import { sendZoneAssignedEmail } from './email.service'

export async function listUsers(filters?: { role?: string; hasZone?: boolean }) {
  return prisma.user.findMany({
    where: {
      ...(filters?.role && { role: filters.role as any }),
      ...(filters?.hasZone === true  && { zoneId: { not: null } }),
      ...(filters?.hasZone === false && { zoneId: null }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      dni: true,
      phone: true,
      address: true,
      district: true,
      role: true,
      isActive: true,
      isVerified: true,
      zoneId: true,
      zone: { select: { id: true, name: true, district: true, color: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function assignZone(userId: string, zoneId: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true },
  })
  if (!user) throw { status: 404, message: 'Usuario no encontrado' }

  let zoneName = ''
  let zoneDistrict = ''

  if (zoneId) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } })
    if (!zone) throw { status: 404, message: 'Zona no encontrada' }
    zoneName = zone.name
    zoneDistrict = zone.district
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { zoneId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      zoneId: true,
      zone: { select: { id: true, name: true, district: true, color: true } },
    },
  })

  if (zoneId && zoneName) {
    try {
      await sendZoneAssignedEmail(user.email, user.firstName, zoneName, zoneDistrict)
    } catch (err) {
      console.error('Error enviando email de asignación de zona:', err)
    }
  }

  return updated
}
