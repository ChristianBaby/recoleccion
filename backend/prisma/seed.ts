import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_PASSWORD = 'Admin2024@'
const OPERATOR_PASSWORD = 'Operador2024@'
const SALT_ROUNDS = 12

// 9 zonas del distrito de Poroy — polígonos trazados manualmente en el sistema
// Formato GeoJSON: [lng, lat][] — anillo cerrado
const POROY_ZONES_DATA = [
  {
    name: 'Poroy Centro',
    lat: -13.49553, lng: -72.04360,
    type: 'Zona principal / pueblo',
    polygon: [
      [-72.05949783325197, -13.48979583935438],
      [-72.033,            -13.493           ],
      [-72.03340530395509, -13.50924186732949],
      [-72.05992698669435, -13.50523594824782],
      [-72.05949783325197, -13.48979583935438]
    ]
  },
  {
    name: 'Ticahuerta',
    lat: -13.48975, lng: -72.04266,
    type: 'Zona norte cercana a Poroy Centro',
    polygon: [
      [-72.05237388610841, -13.47635795921931],
      [-72.03297615051271, -13.47652489404187],
      [-72.033,            -13.493           ],
      [-72.05932617187501, -13.48971237659292],
      [-72.05237388610841, -13.47635795921931]
    ]
  },
  {
    name: 'Cruz Verde de Quehuepay',
    lat: -13.50626, lng: -72.00906,
    type: 'Zona urbana / barrio',
    polygon: [
      [-72.01319217681886, -13.49876791608425],
      [-72.00396537780763, -13.49935213264323],
      [-72.004,            -13.508           ],
      [-72.013,            -13.508           ],
      [-72.01319217681886, -13.49876791608425]
    ]
  },
  {
    name: 'APV Las Rocas',
    lat: -13.50967, lng: -72.00722,
    type: 'Zona urbana cercana a Cruz Verde',
    polygon: [
      [-72.013, -13.508],
      [-72.004, -13.508],
      [-72.004, -13.520],
      [-72.013, -13.520],
      [-72.013, -13.508]
    ]
  },
  {
    name: 'Sencca Quispihura',
    lat: -13.49954, lng: -72.00772,
    type: 'Zona urbana / barrio',
    polygon: [
      [-72.01332092285158, -13.48128248748189],
      [-72.00413703918458, -13.48787618846229],
      [-72.00396537780763, -13.49922694350098],
      [-72.01263427734376, -13.49864272663555],
      [-72.01332092285158, -13.48128248748189]
    ]
  },
  {
    name: 'Huarahuaylla',
    lat: -13.50200, lng: -72.01853,
    type: 'Zona intermedia central',
    polygon: [
      [-72.02121734619142, -13.47961316723382],
      [-72.01332092285158, -13.48161635013241],
      [-72.013,            -13.520           ],
      [-72.02070236206056, -13.51157862238774],
      [-72.02121734619142, -13.47961316723382]
    ]
  },
  {
    name: 'Huampar',
    lat: -13.50267, lng: -72.02273,
    type: 'Centro poblado / comunidad norte',
    polygon: [
      [-72.03271865844728, -13.47677529605716],
      [-72.02078819274904, -13.48036436278824],
      [-72.021,            -13.503           ],
      [-72.03306198120119, -13.49972769967599],
      [-72.03271865844728, -13.47677529605716]
    ]
  },
  {
    name: 'Chinchaysuyo',
    lat: -13.50331, lng: -72.02323,
    type: 'Centro poblado / comunidad sur',
    polygon: [
      [-72.021,            -13.503           ],
      [-72.02100276947023, -13.51145343966155],
      [-72.03297615051271, -13.50924186732949],
      [-72.03297615051271, -13.49985288855558],
      [-72.021,            -13.503           ]
    ]
  },
  {
    name: 'Huasahuara',
    lat: -13.50620, lng: -71.99971,
    type: 'Zona oriental del distrito',
    polygon: [
      [-72.00387954711915, -13.48829350518598],
      [-71.98997497558595, -13.50264875642162],
      [-71.990,            -13.520           ],
      [-72.004,            -13.520           ],
      [-72.00387954711915, -13.48829350518598]
    ]
  }
]

const COLORS = [
  '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
  '#9333ea', '#c026d3', '#db2777'
]


async function main() {
  const isProd = process.env.NODE_ENV === 'production'
  console.log(`🌱 Iniciando seed de EcoRutas - Municipalidad de Poroy (Modo: ${isProd ? 'Producción' : 'Desarrollo'})...\n`)

  // ── Contraseñas ────────────────────────────────────────────────────────────
  const [adminHash, operatorHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(OPERATOR_PASSWORD, SALT_ROUNDS),
  ])

  // ── Limpiar base de datos existente (solo en desarrollo) ─────────────────────
  if (!isProd) {
    console.log('🧹 Modo desarrollo: Limpiando registros anteriores de la base de datos...')
    await prisma.gpsTrack.deleteMany()
    await prisma.routeExecution.deleteMany()
    await prisma.routeWasteType.deleteMany()
    await prisma.waypoint.deleteMany()
    await prisma.route.deleteMany()
    await prisma.incident.deleteMany()
    await prisma.learnVisit.deleteMany()
    
    // Desvincular temporalmente a los usuarios de las zonas que se borrarán
    await prisma.user.updateMany({ data: { zoneId: null } })
    await prisma.zone.deleteMany()
    console.log('✅ Base de datos limpia.')
  } else {
    console.log('🛡️ Modo producción: Evitando limpieza destructiva general. Buscando zonas obsoletas...')
    
    // Limpieza selectiva e inteligente de zonas obsoletas en producción
    const officialZoneNames = POROY_ZONES_DATA.map(z => z.name)
    const obsoleteZones = await prisma.zone.findMany({
      where: {
        name: { notIn: officialZoneNames }
      },
      select: { id: true, name: true }
    })

    if (obsoleteZones.length > 0) {
      const obsoleteIds = obsoleteZones.map(z => z.id)
      console.log(`🧹 Producción: Eliminando ${obsoleteZones.length} zonas que ya no sirven: ${obsoleteZones.map(z => z.name).join(', ')}`)

      // 1. Desvincular usuarios
      await prisma.user.updateMany({
        where: { zoneId: { in: obsoleteIds } },
        data: { zoneId: null }
      })

      // 2. Limpiar visitas educativas de esas zonas
      await prisma.learnVisit.deleteMany({
        where: { zoneId: { in: obsoleteIds } }
      })

      // 3. Eliminar tracks GPS de ejecuciones de rutas obsoletas
      await prisma.gpsTrack.deleteMany({
        where: { routeExecution: { route: { zoneId: { in: obsoleteIds } } } }
      })

      // 4. Eliminar ejecuciones de rutas obsoletas
      await prisma.routeExecution.deleteMany({
        where: { route: { zoneId: { in: obsoleteIds } } }
      })

      // 5. Eliminar waypoints de rutas obsoletas
      await prisma.waypoint.deleteMany({
        where: { route: { zoneId: { in: obsoleteIds } } }
      })

      // 6. Eliminar tipos de residuos de rutas obsoletas
      await prisma.routeWasteType.deleteMany({
        where: { route: { zoneId: { in: obsoleteIds } } }
      })

      // 7. Eliminar rutas obsoletas
      await prisma.route.deleteMany({
        where: { zoneId: { in: obsoleteIds } }
      })

      // 8. Eliminar zonas obsoletas
      await prisma.zone.deleteMany({
        where: { id: { in: obsoleteIds } }
      })
      console.log('✅ Zonas obsoletas y sus rutas asociadas se limpiaron de producción.')
    } else {
      console.log('ℹ️ No se encontraron zonas obsoletas que limpiar en producción.')
    }
  }


  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminsData = [
    { email: '204805@unsaac.edu.pe',          dni: '99999901', firstName: 'Admin',    lastName: 'EcoRutas Poroy' },
    { email: '174449@unsaac.edu.pe',          dni: '99999902', firstName: 'Cristian', lastName: 'Admin Poroy' },
    { email: 'peruandeanaventures@gmail.com', dni: '99999903', firstName: 'Cristian', lastName: 'QQ' }
  ]

  const admins = await Promise.all(
    adminsData.map((adm) =>
      prisma.user.upsert({
        where: { email: adm.email },
        update: { role: 'ADMIN', isVerified: true, isActive: true },
        create: {
          ...adm,
          password: adminHash,
          role: 'ADMIN',
          isVerified: true,
          isActive: true,
        },
      })
    )
  )
  const admin = admins[0]
  console.log('✅ Administradores creados/actualizados:', admins.map(a => a.email).join(', '))

  // ── Operadores ─────────────────────────────────────────────────────────────
  const operatorsData = [
    { email: 'cmamani@ecorutas.pe',    dni: '43100001', firstName: 'Carlos',    lastName: 'Mamani Quispe' },
    { email: 'lcondori@ecorutas.pe',   dni: '43100002', firstName: 'Luis',      lastName: 'Condori Flores' },
    { email: 'jhuanca@ecorutas.pe',    dni: '43100003', firstName: 'Juan',      lastName: 'Huanca Ttito' },
    { email: 'pccahuana@ecorutas.pe',  dni: '43100004', firstName: 'Pedro',     lastName: 'Ccahuana Roca' },
    { email: 'mquispe@ecorutas.pe',    dni: '43100005', firstName: 'Miguel',    lastName: 'Quispe Gutierrez' },
    { email: 'rcusihuaman@ecorutas.pe',dni: '43100006', firstName: 'Roberto',   lastName: 'Cusihuaman Ore' },
    { email: 'fachahui@ecorutas.pe',   dni: '43100007', firstName: 'Fernando',  lastName: 'Achahui Ccasa' },
    { email: 'dquispe@ecorutas.pe',    dni: '43100008', firstName: 'David',     lastName: 'Quispe Huaman' },
    { email: 'attito@ecorutas.pe',     dni: '43100009', firstName: 'Alejandro', lastName: 'Ttito Chavez' },
    { email: 'vccopa@ecorutas.pe',     dni: '43100010', firstName: 'Victor',    lastName: 'Ccopa Saavedra' },
  ]

  const operators = await Promise.all(
    operatorsData.map((op) =>
      prisma.user.upsert({
        where: { email: op.email },
        update: {},
        create: { ...op, password: operatorHash, role: 'OPERATOR', isVerified: true, isActive: true },
      }),
    ),
  )
  console.log('✅ Operadores creados/actualizados:', operators.length)

  // ── Vehículos (Reducido a un máximo de 2) ──────────────────────────────────
  const vehiclesData = [
    { plate: 'CUZ-001', type: 'COMPACTOR'  as const, brand: 'Mercedes-Benz', model: 'Atego 1725', year: 2019, capacity: 10 },
    { plate: 'CUZ-002', type: 'COMPACTOR'  as const, brand: 'Mercedes-Benz', model: 'Atego 1725', year: 2020, capacity: 10 },
  ]

  // Limpieza selectiva e inteligente de vehículos obsoletos (Tanto en desarrollo como producción)
  const officialPlates = vehiclesData.map(v => v.plate)

  // 1. Desvincular vehículos de las rutas activas
  await prisma.route.updateMany({
    where: { vehicle: { plate: { notIn: officialPlates } } },
    data: { vehicleId: null }
  })

  // 2. Eliminar tracks GPS de ejecuciones asociadas a vehículos obsoletos
  await prisma.gpsTrack.deleteMany({
    where: { routeExecution: { vehicle: { plate: { notIn: officialPlates } } } }
  })

  // 3. Eliminar ejecuciones de rutas asociadas a vehículos obsoletos
  await prisma.routeExecution.deleteMany({
    where: { vehicle: { plate: { notIn: officialPlates } } }
  })

  // 4. Eliminar los vehículos obsoletos
  const deleteVehiclesRes = await prisma.vehicle.deleteMany({
    where: { plate: { notIn: officialPlates } }
  })
  if (deleteVehiclesRes.count > 0) {
    console.log(`🧹 Limpiados ${deleteVehiclesRes.count} vehículos obsoletos de la base de datos.`)
  }

  const vehicles = await Promise.all(
    vehiclesData.map((v) =>
      prisma.vehicle.upsert({
        where: { plate: v.plate },
        update: { type: v.type, brand: v.brand, model: v.model, year: v.year, capacity: v.capacity },
        create: { ...v, status: 'AVAILABLE', isActive: true },
      }),
    ),
  )
  console.log('✅ Vehículos creados/actualizados:', vehicles.length)

  // ── Tipos de residuos (NTP 900.058) ───────────────────────────────────────
  const wasteTypesData = [
    {
      name: 'Residuos orgánicos',
      category: 'ORGANIC' as const,
      colorCode: '#92400e',
      description: 'Residuos de origen biológico que se descomponen naturalmente.',
      examples: ['Restos de comida', 'Cáscaras de frutas', 'Restos de verduras', 'Yerba de mate', 'Poda de jardín'],
      instructions: 'Depositar en bolsa o contenedor marrón. No mezclar con otros residuos.',
    },
    {
      name: 'Plástico',
      category: 'RECYCLABLE' as const,
      colorCode: '#1d4ed8',
      description: 'Botellas, envases y objetos de plástico reciclable.',
      examples: ['Botellas PET', 'Envases de shampoo', 'Tapas plásticas', 'Envases de yogurt', 'Bolsas plásticas limpias'],
      instructions: 'Enjuagar antes de depositar. Aplastar para reducir volumen. Bolsa azul.',
    },
    {
      name: 'Papel y cartón',
      category: 'RECYCLABLE' as const,
      colorCode: '#1e40af',
      description: 'Papel, periódicos, revistas y cajas de cartón.',
      examples: ['Periódicos', 'Revistas', 'Cajas de cartón', 'Papel de oficina', 'Bolsas de papel'],
      instructions: 'Mantener seco. Plegar cajas. Depositar en bolsa azul.',
    },
    {
      name: 'Vidrio',
      category: 'RECYCLABLE' as const,
      colorCode: '#1e3a5f',
      description: 'Botellas y frascos de vidrio.',
      examples: ['Botellas de bebidas', 'Frascos de conserva', 'Envases de mermelada', 'Botellas de vidrio oscuro'],
      instructions: 'Enjuagar. No romper. Depositar en contenedor azul o bolsa azul reforzada.',
    },
    {
      name: 'Residuos no aprovechables',
      category: 'NON_RECYCLABLE' as const,
      colorCode: '#1c1917',
      description: 'Residuos que no pueden reciclarse ni compostarse.',
      examples: ['Pañales', 'Papel higiénico', 'Servilletas usadas', 'Ropa en mal estado', 'Cerámica rota'],
      instructions: 'Depositar en bolsa negra bien cerrada.',
    },
    {
      name: 'Residuos peligrosos',
      category: 'HAZARDOUS' as const,
      colorCode: '#ea580c',
      description: 'Residuos con riesgo para la salud o el ambiente.',
      examples: ['Pilas y baterías', 'Medicamentos vencidos', 'Aceite de motor', 'Pinturas', 'Plaguicidas'],
      instructions: 'NO mezclar. Llevar a puntos de acopio autorizados. Bolsa naranja.',
    },
  ]

  const wasteTypes = await Promise.all(
    wasteTypesData.map((wt) =>
      prisma.wasteType.upsert({
        where: { name: wt.name },
        update: {},
        create: wt,
      }),
    ),
  )
  console.log('✅ Tipos de residuos creados/actualizados:', wasteTypes.length)

  // ── Creación de las 9 zonas de Poroy (Idempotente) ──────────────────────────
  const zones = []
  for (let i = 0; i < POROY_ZONES_DATA.length; i++) {
    const zData = POROY_ZONES_DATA[i]
    const color = COLORS[i % COLORS.length]
    const geometry = { type: 'Polygon', coordinates: [zData.polygon] }

    const zone = await prisma.zone.upsert({
      where: { name: zData.name },
      update: { geometry: geometry as any },
      create: {
        name: zData.name,
        district: 'Poroy',
        color,
        description: `Zona operativa de tipo ${zData.type} en el distrito de Poroy.`,
        geometry: geometry as any,
        createdById: admin.id
      }
    })
    zones.push(zone)
  }
  console.log('✅ Zonas de Poroy georreferenciadas creadas/verificadas:', zones.length)

  // ── Lógica específica de Desarrollo (Rutas y asignaciones de prueba) ────────
  if (!isProd) {
    // Asignar zonas de prueba a operadores
    for (let i = 0; i < operators.length; i++) {
      await prisma.user.update({
        where: { id: operators[i].id },
        data: { zoneId: zones[i % zones.length].id }
      })
    }
    console.log('✅ Zonas de prueba asignadas a operadores.')

    // Se crearán rutas asociadas a las zonas de Poroy
    let routeCount = 0
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i]
      const zData = POROY_ZONES_DATA[i]
      
      const offset = 0.003 // ~330 m para waypoints de prueba

      // Definir los 4 puntos cardinales del polígono generado como waypoints
      const wps = [
        { order: 1, name: `Inicio de recolección — ${zone.name}`, lat: zData.lat - offset / 2, lng: zData.lng - offset / 2, estimatedTime: '07:00' },
        { order: 2, name: `Punto de acopio A — ${zone.name}`,     lat: zData.lat - offset / 2, lng: zData.lng + offset / 2, estimatedTime: '07:20' },
        { order: 3, name: `Punto de acopio B — ${zone.name}`,     lat: zData.lat + offset / 2, lng: zData.lng + offset / 2, estimatedTime: '07:45' },
        { order: 4, name: `Punto final de control — ${zone.name}`,lat: zData.lat + offset / 2, lng: zData.lng - offset / 2, estimatedTime: '08:15' },
      ]

      const dayOfWeek = i % 2 === 0 ? [1, 3, 5] : [2, 4, 6]
      const wtIdxs = i % 2 === 0 ? [0, 4] : [1, 2, 3]

      const route = await prisma.route.create({
        data: {
          name: `Ruta Recolección ${zone.name}`,
          status: 'ACTIVE',
          zoneId: zone.id,
          vehicleId: vehicles[i % vehicles.length].id,
          operatorId: operators[i % operators.length].id,
          createdById: admin.id,
          dayOfWeek,
          startTime: '07:00',
          estimatedDuration: 90
        }
      })

      await prisma.waypoint.createMany({
        data: wps.map((wp) => ({ ...wp, routeId: route.id })),
      })

      await prisma.routeWasteType.createMany({
        data: wtIdxs.map((idx) => ({ routeId: route.id, wasteTypeId: wasteTypes[idx].id })),
      })

      routeCount++
    }
    console.log('✅ Rutas de prueba creadas:', routeCount)
  }

  console.log('\n🎉 Seed de la Municipalidad de Poroy completado exitosamente!')
  console.log('──────────────────────────────────────────────────────')
  console.log('📧 Admin    : 204805@unsaac.edu.pe  / Admin2024@')
  console.log('📧 Operador : cmamani@ecorutas.pe   / Operador2024@')
  console.log('──────────────────────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    ;(globalThis as any).process?.exit(1)
  })
  .finally(() => prisma.$disconnect())
