import { getCitizenParticipation } from '../../src/services/report.service'
import { prisma } from '../../src/config/prisma'

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    zone: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    learnVisit: {
      findMany: jest.fn(),
    },
  },
}))

describe('Reporte de participacion ciudadana', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('aplica el rango de fechas al resumen y al detalle por zona', async () => {
    const from = '2026-06-01'
    const to = '2026-06-10'

    ;(prisma.zone.findMany as jest.Mock).mockResolvedValue([
      { id: 'zone-1', name: 'Zona 1', district: 'Poroy', color: '#0f766e' },
    ])
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([{ zoneId: 'zone-1' }])
    ;(prisma.user.count as jest.Mock).mockImplementation(({ where }) =>
      where?.createdAt ? 1 : 2,
    )
    ;(prisma.incident.findMany as jest.Mock).mockResolvedValue([
      {
        type: 'MISSED_COLLECTION',
        status: 'OPEN',
        citizen: { zoneId: 'zone-1' },
      },
    ])
    ;(prisma.incident.count as jest.Mock).mockImplementation((args) =>
      args?.where?.createdAt ? 1 : 2,
    )
    ;(prisma.learnVisit.findMany as jest.Mock).mockResolvedValue([
      { zoneId: 'zone-1', userId: 'citizen-1' },
    ])

    const result = await getCitizenParticipation({ from, to })

    expect(result.summary.totalCitizens).toBe(1)
    expect(result.summary.totalIncidents).toBe(1)
    expect(result.summary.totalLearnVisits).toBe(1)
    expect(result.byZone[0]).toMatchObject({
      citizenCount: 1,
      incidents: { total: 1, open: 1, resolved: 0 },
      learnVisits: 1,
      learnUniqueUsers: 1,
    })
  })
})
