import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_PASSWORD = 'Admin2024@'
const OPERATOR_PASSWORD = 'Operador2024@'
const SALT_ROUNDS = 12

// Lista oficial de 26 zonas operativas de Poroy
const POROY_ZONES_DATA = [
  // Iniciales (1 al 15)
  { name: 'Poroy Centro',          type: 'Zona urbana principal' },
  { name: 'Cruz Verde',            type: 'Sector / APV' },
  { name: 'Cruz Verde Quehuepay',   type: 'Barrio / sector' },
  { name: 'El Bosque',             type: 'APV / sector urbano' },
  { name: 'Brisas del Arco',       type: 'APV' },
  { name: 'Villa Las Rocas',       type: 'APV' },
  { name: '30 de Agosto',          type: 'APV' },
  { name: 'Puerto Rico',           type: 'APV' },
  { name: 'El Paraíso',            type: 'APV' },
  { name: 'Nuevo Horizonte',       type: 'APV' },
  { name: 'Villa Cruz Verde',      type: 'APV' },
  { name: 'Bella Esperanza',       type: 'APV' },
  { name: 'Ollachayoqpampa',       type: 'APV / sector' },
  { name: 'Ccollayocpata',         type: 'APV / sector' },
  { name: 'Chuñunapampa',          type: 'APV / sector' },
  // Extendidas (16 al 26)
  { name: 'Huampar',               type: 'Centro poblado / comunidad' },
  { name: 'Chinchaysuyo',          type: 'Centro poblado / comunidad' },
  { name: 'Sencca Quispihuara',    type: 'Comunidad / centro poblado cercano' },
  { name: 'Huarahuaylla Ticahuerta',type: 'Comunidad / centro poblado' },
  { name: 'Rayampata',             type: 'Centro poblado' },
  { name: 'Yanamayo',              type: 'Centro poblado' },
  { name: 'Queñuapata',            type: 'Centro poblado' },
  { name: 'Llanumpata',            type: 'Centro poblado' },
  { name: 'Urbambillayoc',         type: 'Centro poblado' },
  { name: 'Chulluncoy',            type: 'Centro poblado' },
  { name: 'Paucarpata',            type: 'Centro poblado' }
]

const COLORS = [
  '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
  '#9333ea', '#c026d3', '#db2777', '#e11d48', '#ea580c', '#d97706',
  '#ca8a04', '#65a30d', '#16a34a', '#059669', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#f97316'
]

// Generar un polígono rectangular alrededor de Poroy desplazado por índice
function generatePoroyPolygon(index: number) {
  const baseLat = -13.4900
  const baseLng = -72.0400
  
  // Distribuir en una rejilla de 5x6
  const row = Math.floor(index / 5)
  const col = index % 5
  
  // Desplazamiento de aproximadamente 600m - 1km (0.007 grados)
  const centerLat = baseLat + (row - 2) * 0.007
  const centerLng = baseLng + (col - 2) * 0.007
  
  const size = 0.0025 // tamaño del cuadradito
  
  return {
    type: 'Polygon',
    coordinates: [[
      [centerLng - size, centerLat - size],
      [centerLng + size, centerLat - size],
      [centerLng + size, centerLat + size],
      [centerLng - size, centerLat + size],
      [centerLng - size, centerLat - size] // cerrar el polígono
    ]]
  }
}

async function main() {
  console.log('🌱 Iniciando seed de EcoRutas - Municipalidad de Poroy...\n')

  // ── Contraseñas ────────────────────────────────────────────────────────────
  const [adminHash, operatorHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(OPERATOR_PASSWORD, SALT_ROUNDS),
  ])

  // ── Limpiar base de datos existente ─────────────────────────────────────────
  console.log('🧹 Limpiando registros anteriores de la base de datos...')
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

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: '204805@unsaac.edu.pe' },
    update: { role: 'ADMIN', isVerified: true, isActive: true },
    create: {
      email: '204805@unsaac.edu.pe',
      password: adminHash,
      dni: '99999901',
      firstName: 'Admin',
      lastName: 'EcoRutas Poroy',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  })
  console.log('✅ Admin creado/actualizado:', admin.email)

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

  // ── Creación de las 26 zonas de Poroy ──────────────────────────────────────
  const zones = []
  for (let i = 0; i < POROY_ZONES_DATA.length; i++) {
    const zData = POROY_ZONES_DATA[i]
    const color = COLORS[i % COLORS.length]
    const geometry = generatePoroyPolygon(i)
    
    const zone = await prisma.zone.create({
      data: {
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
  console.log('✅ Zonas de Poroy creadas:', zones.length)

  // Asignar zonas de prueba a operadores para evitar colisiones
  for (let i = 0; i < operators.length; i++) {
    await prisma.user.update({
      where: { id: operators[i].id },
      data: { zoneId: zones[i % zones.length].id }
    })
  }
  console.log('✅ Zonas de prueba asignadas a operadores.')

  // ── Creación de Rutas de Prueba en Poroy ────────────────────────────────────
  // Se crearán rutas asociadas a las primeras 10 zonas iniciales
  let routeCount = 0
  
  for (let i = 0; i < 10; i++) {
    const zone = zones[i]
    
    // Obtener centro y dimensiones del polígono de la zona para situar waypoints
    const baseLat = -13.4900
    const baseLng = -72.0400
    const row = Math.floor(i / 5)
    const col = i % 5
    const centerLat = baseLat + (row - 2) * 0.007
    const centerLng = baseLng + (col - 2) * 0.007
    const size = 0.0025

    // Definir los 4 puntos cardinales del polígono como waypoints
    const wps = [
      { order: 1, name: `Inicio de recolección — ${zone.name}`, lat: centerLat - size / 2, lng: centerLng - size / 2, estimatedTime: '07:00' },
      { order: 2, name: `Punto de acopio A — ${zone.name}`,     lat: centerLat - size / 2, lng: centerLng + size / 2, estimatedTime: '07:20' },
      { order: 3, name: `Punto de acopio B — ${zone.name}`,     lat: centerLat + size / 2, lng: centerLng + size / 2, estimatedTime: '07:45' },
      { order: 4, name: `Punto final de control — ${zone.name}`,lat: centerLat + size / 2, lng: centerLng - size / 2, estimatedTime: '08:15' },
    ]

    // Alternar días y tipos de residuos
    const dayOfWeek = i % 2 === 0 ? [1, 3, 5] : [2, 4, 6] // L-M-V o M-J-S
    const wtIdxs = i % 2 === 0 ? [0, 4] : [1, 2, 3] // Orgánicos/No Aprovechables o Reciclables

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
