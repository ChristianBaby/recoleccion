import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_PASSWORD = 'Admin2024@'
const OPERATOR_PASSWORD = 'Operador2024@'
const SALT_ROUNDS = 12

// Lista oficial de 9 zonas georreferenciadas del distrito de Poroy
const POROY_ZONES_DATA = [
  { name: 'Poroy Centro',            lat: -13.49553, lng: -72.04360, radius: 600, type: 'Zona principal / pueblo' },
  { name: 'Ticahuerta',              lat: -13.48975, lng: -72.04266, radius: 500, type: 'Zona cercana a Poroy Centro' },
  { name: 'Cruz Verde de Quehuepay', lat: -13.50626, lng: -72.00906, radius: 600, type: 'Zona urbana / barrio' },
  { name: 'APV Las Rocas',           lat: -13.50967, lng: -72.00722, radius: 500, type: 'Zona urbana cercana a Cruz Verde' },
  { name: 'Sencca Quispihura',       lat: -13.49954, lng: -72.00772, radius: 650, type: 'Zona urbana / barrio' },
  { name: 'Huarahuaylla',            lat: -13.50200, lng: -72.01853, radius: 500, type: 'Zona intermedia' },
  { name: 'Huampar',                 lat: -13.50267, lng: -72.02273, radius: 550, type: 'Centro poblado / comunidad' },
  { name: 'Chinchaysuyo',            lat: -13.50331, lng: -72.02323, radius: 550, type: 'Centro poblado / comunidad' },
  { name: 'Huasahuara',              lat: -13.50620, lng: -71.99971, radius: 600, type: 'Zona cercana / validar alcance' }
]

const COLORS = [
  '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
  '#9333ea', '#c026d3', '#db2777'
]

// Generar un polígono rectangular a partir del centro y el radio en metros
function generatePoroyPolygon(lat: number, lng: number, radiusMeters: number) {
  // A esta latitud (~ -13.5), 1 metro equivale aprox a 0.000009 grados
  const degreePerMeter = 0.000009
  const offset = radiusMeters * degreePerMeter
  
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - offset, lat - offset],
      [lng + offset, lat - offset],
      [lng + offset, lat + offset],
      [lng - offset, lat + offset],
      [lng - offset, lat - offset] // cerrar
    ]]
  }
}

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
    console.log('🛡️ Modo producción: Evitando limpieza destructiva de datos.')
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

  // ── Vehículos ──────────────────────────────────────────────────────────────
  const vehiclesData = [
    { plate: 'CUZ-001', type: 'COMPACTOR'  as const, brand: 'Mercedes-Benz', model: 'Atego 1725', year: 2019, capacity: 10 },
    { plate: 'CUZ-002', type: 'COMPACTOR'  as const, brand: 'Mercedes-Benz', model: 'Atego 1725', year: 2020, capacity: 10 },
    { plate: 'CUZ-003', type: 'COMPACTOR'  as const, brand: 'Volvo',         model: 'FM 380',     year: 2018, capacity: 12 },
    { plate: 'CUZ-004', type: 'COMPACTOR'  as const, brand: 'Volvo',         model: 'FM 380',     year: 2021, capacity: 12 },
    { plate: 'CUZ-005', type: 'COMPACTOR'  as const, brand: 'Scania',        model: 'P 360',      year: 2019, capacity: 14 },
    { plate: 'CUZ-006', type: 'COMPACTOR'  as const, brand: 'Scania',        model: 'P 360',      year: 2022, capacity: 14 },
    { plate: 'CUZ-007', type: 'OPEN_TRUCK' as const, brand: 'Toyota',        model: 'Dyna 300',   year: 2017, capacity: 5  },
    { plate: 'CUZ-008', type: 'OPEN_TRUCK' as const, brand: 'Toyota',        model: 'Dyna 300',   year: 2018, capacity: 5  },
    { plate: 'CUZ-009', type: 'OPEN_TRUCK' as const, brand: 'Isuzu',         model: 'NPR 75L',    year: 2019, capacity: 6  },
    { plate: 'CUZ-010', type: 'OPEN_TRUCK' as const, brand: 'Isuzu',         model: 'NPR 75L',    year: 2020, capacity: 6  },
    { plate: 'CUZ-011', type: 'OPEN_TRUCK' as const, brand: 'Mitsubishi',    model: 'Canter FE',  year: 2021, capacity: 4  },
    { plate: 'CUZ-012', type: 'MINI_TRUCK' as const, brand: 'Kia',           model: 'K2500',      year: 2020, capacity: 2  },
    { plate: 'CUZ-013', type: 'MINI_TRUCK' as const, brand: 'Kia',           model: 'K2500',      year: 2021, capacity: 2  },
    { plate: 'CUZ-014', type: 'MINI_TRUCK' as const, brand: 'Hyundai',       model: 'HR',         year: 2019, capacity: 1.5},
    { plate: 'CUZ-015', type: 'MINI_TRUCK' as const, brand: 'Hyundai',       model: 'HR',         year: 2022, capacity: 1.5},
  ]

  const vehicles = await Promise.all(
    vehiclesData.map((v) =>
      prisma.vehicle.upsert({
        where: { plate: v.plate },
        update: {},
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
    const geometry = generatePoroyPolygon(zData.lat, zData.lng, zData.radius)
    
    const zone = await prisma.zone.upsert({
      where: { name: zData.name },
      update: {},
      create: {
        name: zData.name,
        district: 'Poroy',
        color,
        description: `Zona operativa referencial de tipo ${zData.type} con un radio aproximado de ${zData.radius} metros.`,
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
      
      const degreePerMeter = 0.000009
      const offset = zData.radius * degreePerMeter

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
