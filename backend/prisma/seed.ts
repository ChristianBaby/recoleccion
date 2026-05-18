import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_PASSWORD = 'Admin2024@'
const OPERATOR_PASSWORD = 'Operador2024@'
const SALT_ROUNDS = 12

async function main() {
  console.log('🌱 Iniciando seed de EcoRutas Cusco...\n')

  // ── Contraseñas ────────────────────────────────────────────────────────────
  const [adminHash, operatorHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(OPERATOR_PASSWORD, SALT_ROUNDS),
  ])

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: '204805@unsaac.edu.pe' },
    update: { role: 'ADMIN', isVerified: true, isActive: true },
    create: {
      email: '204805@unsaac.edu.pe',
      password: adminHash,
      dni: '99999901',
      firstName: 'Admin',
      lastName: 'EcoRutas',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  })
  console.log('✅ Admin:', admin.email)

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
  console.log('✅ Operadores:', operators.length)

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
  console.log('✅ Vehículos:', vehicles.length)

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
  console.log('✅ Tipos de residuos:', wasteTypes.length)

  // ── Zonas ─────────────────────────────────────────────────────────────────
  // GeoJSON: coordenadas en [lng, lat]. El polígono cierra repitiendo el primer punto.
  const zonesData = [
    {
      name: 'Cusco Centro',
      district: 'Cusco',
      color: '#dc2626',
      description: 'Centro histórico, Plaza de Armas, San Blas, Mercado San Pedro.',
      geometry: { type: 'Polygon', coordinates: [[ [-72.0015,-13.4980], [-71.9580,-13.4980], [-71.9510,-13.5120], [-71.9520,-13.5380], [-71.9780,-13.5420], [-72.0010,-13.5360], [-72.0050,-13.5200], [-72.0015,-13.4980] ]] },
    },
    {
      name: 'Santiago',
      district: 'Santiago',
      color: '#2563eb',
      description: 'Distrito de Santiago, Av. Ejército, Bancopata, Ttio.',
      geometry: { type: 'Polygon', coordinates: [[ [-72.0450,-13.5150], [-71.9980,-13.5150], [-71.9900,-13.5350], [-71.9960,-13.5750], [-72.0280,-13.5780], [-72.0520,-13.5600], [-72.0530,-13.5280], [-72.0450,-13.5150] ]] },
    },
    {
      name: 'Wanchaq',
      district: 'Wanchaq',
      color: '#16a34a',
      description: 'Distrito de Wanchaq, zona residencial y comercial.',
      geometry: { type: 'Polygon', coordinates: [[ [-71.9650,-13.5100], [-71.9280,-13.5080], [-71.9200,-13.5220], [-71.9250,-13.5520], [-71.9580,-13.5540], [-71.9680,-13.5380], [-71.9700,-13.5200], [-71.9650,-13.5100] ]] },
    },
    {
      name: 'San Sebastián',
      district: 'San Sebastián',
      color: '#7c3aed',
      description: 'Distrito de San Sebastián, zona en expansión al este de Cusco.',
      geometry: { type: 'Polygon', coordinates: [[ [-71.9320,-13.5100], [-71.8850,-13.5080], [-71.8780,-13.5280], [-71.8820,-13.5680], [-71.9200,-13.5720], [-71.9380,-13.5520], [-71.9400,-13.5300], [-71.9320,-13.5100] ]] },
    },
    {
      name: 'San Jerónimo',
      district: 'San Jerónimo',
      color: '#d97706',
      description: 'Distrito de San Jerónimo, al este del Valle del Cusco.',
      geometry: { type: 'Polygon', coordinates: [[ [-71.9020,-13.5430], [-71.8480,-13.5420], [-71.8380,-13.5620], [-71.8430,-13.6100], [-71.8850,-13.6150], [-71.9080,-13.5950], [-71.9120,-13.5680], [-71.9020,-13.5430] ]] },
    },
    {
      name: 'Poroy',
      district: 'Poroy',
      color: '#0891b2',
      description: 'Distrito de Poroy, al noroeste de la ciudad.',
      geometry: { type: 'Polygon', coordinates: [[ [-72.1320,-13.4100], [-72.0580,-13.4080], [-72.0480,-13.4380], [-72.0550,-13.4900], [-72.0950,-13.4980], [-72.1350,-13.4820], [-72.1420,-13.4520], [-72.1320,-13.4100] ]] },
    },
  ]

  const zones = await Promise.all(
    zonesData.map((z) =>
      prisma.zone.upsert({
        where: { name: z.name },
        update: {},
        create: { ...z, geometry: z.geometry as any, createdById: admin.id },
      }),
    ),
  )
  console.log('✅ Zonas:', zones.length)

  const [zoneCusco, zoneSantiago, zoneWanchaq, zoneSanSeb, zoneSanJer, zonePoroy] = zones

  // ── Limpiar rutas existentes para evitar duplicados al re-ejecutar ─────────
  await prisma.gpsTrack.deleteMany()
  await prisma.routeExecution.deleteMany()
  await prisma.routeWasteType.deleteMany()
  await prisma.waypoint.deleteMany()
  await prisma.route.deleteMany()

  // ── Rutas ─────────────────────────────────────────────────────────────────
  // Índices de wasteTypes: 0=Orgánicos 1=Plástico 2=Papel 3=Vidrio 4=No aprovechable 5=Peligrosos
  // dayOfWeek: 0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb

  type WP = { order: number; name: string; lat: number; lng: number; estimatedTime: string }
  type RouteInput = {
    name: string
    zoneId: string
    dayOfWeek: number[]
    startTime: string
    estimatedDuration: number
    vehicleIdx: number
    operatorIdx: number
    wtIdxs: number[]
    wps: WP[]
  }

  const routesData: RouteInput[] = [

    // ══════════════════════════════════════════════════════════════════════════
    // CUSCO CENTRO  (9 rutas)
    // ══════════════════════════════════════════════════════════════════════════
    {
      name: 'Centro Histórico – Mañana A',
      zoneId: zoneCusco.id, dayOfWeek: [1,3,5], startTime: '06:00', estimatedDuration: 180,
      vehicleIdx: 0, operatorIdx: 0, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Plaza de Armas',              lat:-13.5165, lng:-71.9785, estimatedTime:'06:00' },
        { order:2, name:'Calle Mantas',                lat:-13.5180, lng:-71.9770, estimatedTime:'06:20' },
        { order:3, name:'Av. El Sol',                  lat:-13.5210, lng:-71.9750, estimatedTime:'06:45' },
        { order:4, name:'Mercado San Pedro',           lat:-13.5240, lng:-71.9820, estimatedTime:'07:10' },
        { order:5, name:'Planta de Transferencia',     lat:-13.5140, lng:-71.9680, estimatedTime:'08:50' },
      ],
    },
    {
      name: 'Centro Histórico – Tarde B',
      zoneId: zoneCusco.id, dayOfWeek: [1,3,5], startTime: '14:00', estimatedDuration: 150,
      vehicleIdx: 1, operatorIdx: 1, wtIdxs: [1,4],
      wps: [
        { order:1, name:'Av. Tullumayo',               lat:-13.5155, lng:-71.9720, estimatedTime:'14:00' },
        { order:2, name:'Calle Pumacurco',             lat:-13.5140, lng:-71.9745, estimatedTime:'14:25' },
        { order:3, name:'Portal de Belén',             lat:-13.5172, lng:-71.9790, estimatedTime:'14:55' },
        { order:4, name:'Santa Catalina',              lat:-13.5185, lng:-71.9800, estimatedTime:'15:20' },
        { order:5, name:'Planta de Transferencia',     lat:-13.5140, lng:-71.9680, estimatedTime:'16:30' },
      ],
    },
    {
      name: 'San Blas – Mañana',
      zoneId: zoneCusco.id, dayOfWeek: [2,4,6], startTime: '06:30', estimatedDuration: 120,
      vehicleIdx: 12, operatorIdx: 2, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Plaza San Blas',              lat:-13.5115, lng:-71.9740, estimatedTime:'06:30' },
        { order:2, name:'Calle Hatunrumiyoc',          lat:-13.5130, lng:-71.9760, estimatedTime:'06:50' },
        { order:3, name:'Calle Siete Cuartones',       lat:-13.5145, lng:-71.9780, estimatedTime:'07:15' },
        { order:4, name:'Planta de Transferencia',     lat:-13.5140, lng:-71.9680, estimatedTime:'08:30' },
      ],
    },
    {
      name: 'Mercado San Pedro – Diario',
      zoneId: zoneCusco.id, dayOfWeek: [1,2,3,4,5,6], startTime: '05:30', estimatedDuration: 90,
      vehicleIdx: 2, operatorIdx: 3, wtIdxs: [0,1,4],
      wps: [
        { order:1, name:'Mercado San Pedro – Exterior', lat:-13.5245, lng:-71.9825, estimatedTime:'05:30' },
        { order:2, name:'Mercado San Pedro – Interior', lat:-13.5235, lng:-71.9815, estimatedTime:'05:45' },
        { order:3, name:'Cascaparo',                    lat:-13.5225, lng:-71.9800, estimatedTime:'06:10' },
        { order:4, name:'Planta de Transferencia',      lat:-13.5140, lng:-71.9680, estimatedTime:'06:55' },
      ],
    },
    {
      name: 'Limacpampa y Belén',
      zoneId: zoneCusco.id, dayOfWeek: [1,3,5], startTime: '07:00', estimatedDuration: 120,
      vehicleIdx: 3, operatorIdx: 4, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Limacpampa Grande',           lat:-13.5200, lng:-71.9720, estimatedTime:'07:00' },
        { order:2, name:'Belén',                       lat:-13.5195, lng:-71.9790, estimatedTime:'07:25' },
        { order:3, name:'Qorikancha',                  lat:-13.5205, lng:-71.9755, estimatedTime:'07:50' },
        { order:4, name:'Planta de Transferencia',     lat:-13.5140, lng:-71.9680, estimatedTime:'08:55' },
      ],
    },
    {
      name: 'Av. El Sol – Comercial Nocturno',
      zoneId: zoneCusco.id, dayOfWeek: [1,2,3,4,5], startTime: '20:00', estimatedDuration: 90,
      vehicleIdx: 6, operatorIdx: 5, wtIdxs: [1,2,4],
      wps: [
        { order:1, name:'Av. El Sol – Inicio',         lat:-13.5220, lng:-71.9760, estimatedTime:'20:00' },
        { order:2, name:'Av. El Sol – Centro',         lat:-13.5270, lng:-71.9740, estimatedTime:'20:20' },
        { order:3, name:'Av. El Sol – Ovalo',          lat:-13.5310, lng:-71.9720, estimatedTime:'20:40' },
        { order:4, name:'Planta Sur',                  lat:-13.5380, lng:-71.9700, estimatedTime:'21:20' },
      ],
    },
    {
      name: 'Picchu Residencial',
      zoneId: zoneCusco.id, dayOfWeek: [2,4,6], startTime: '07:00', estimatedDuration: 120,
      vehicleIdx: 7, operatorIdx: 6, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Picchu Bajo',                 lat:-13.5080, lng:-71.9950, estimatedTime:'07:00' },
        { order:2, name:'Picchu Alto',                 lat:-13.5050, lng:-71.9920, estimatedTime:'07:30' },
        { order:3, name:'Urb. Vallecito',              lat:-13.5060, lng:-71.9900, estimatedTime:'07:55' },
        { order:4, name:'Planta de Transferencia',     lat:-13.5140, lng:-71.9680, estimatedTime:'08:55' },
      ],
    },
    {
      name: 'Av. Grau – Nocturno',
      zoneId: zoneCusco.id, dayOfWeek: [1,2,3,4,5,6], startTime: '21:00', estimatedDuration: 60,
      vehicleIdx: 8, operatorIdx: 7, wtIdxs: [4],
      wps: [
        { order:1, name:'Av. Grau Norte',              lat:-13.5250, lng:-71.9810, estimatedTime:'21:00' },
        { order:2, name:'Av. Grau Centro',             lat:-13.5265, lng:-71.9825, estimatedTime:'21:20' },
        { order:3, name:'Rosaspata',                   lat:-13.5280, lng:-71.9840, estimatedTime:'21:40' },
        { order:4, name:'Planta Sur',                  lat:-13.5380, lng:-71.9700, estimatedTime:'22:00' },
      ],
    },
    {
      name: 'Ccasccaparo – Sábados',
      zoneId: zoneCusco.id, dayOfWeek: [6], startTime: '08:00', estimatedDuration: 150,
      vehicleIdx: 13, operatorIdx: 8, wtIdxs: [0,1,2,4],
      wps: [
        { order:1, name:'Ccasccaparo – Inicio',        lat:-13.5220, lng:-71.9800, estimatedTime:'08:00' },
        { order:2, name:'Ccasccaparo – Mercadillo',    lat:-13.5228, lng:-71.9790, estimatedTime:'08:25' },
        { order:3, name:'Portal Confituría',           lat:-13.5175, lng:-71.9792, estimatedTime:'09:00' },
        { order:4, name:'Planta de Transferencia',     lat:-13.5140, lng:-71.9680, estimatedTime:'10:20' },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SANTIAGO  (8 rutas)
    // ══════════════════════════════════════════════════════════════════════════
    {
      name: 'Santiago Centro – Mañana',
      zoneId: zoneSantiago.id, dayOfWeek: [1,3,5], startTime: '06:00', estimatedDuration: 180,
      vehicleIdx: 4, operatorIdx: 9, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Plaza Santiago',              lat:-13.5400, lng:-72.0050, estimatedTime:'06:00' },
        { order:2, name:'Av. Ejercito – Inicio',       lat:-13.5380, lng:-72.0020, estimatedTime:'06:25' },
        { order:3, name:'Mercado Vinocanchon',         lat:-13.5420, lng:-72.0080, estimatedTime:'07:00' },
        { order:4, name:'Urb. Bancopata',              lat:-13.5460, lng:-72.0100, estimatedTime:'07:35' },
        { order:5, name:'Planta Sur',                  lat:-13.5500, lng:-72.0050, estimatedTime:'08:55' },
      ],
    },
    {
      name: 'Santiago Centro – Tarde',
      zoneId: zoneSantiago.id, dayOfWeek: [2,4,6], startTime: '14:00', estimatedDuration: 150,
      vehicleIdx: 5, operatorIdx: 0, wtIdxs: [0,1,4],
      wps: [
        { order:1, name:'Plaza Santiago',              lat:-13.5400, lng:-72.0050, estimatedTime:'14:00' },
        { order:2, name:'Av. Manco Capac',             lat:-13.5390, lng:-72.0030, estimatedTime:'14:20' },
        { order:3, name:'Mercado Santiago',            lat:-13.5410, lng:-72.0070, estimatedTime:'14:50' },
        { order:4, name:'Planta Sur',                  lat:-13.5500, lng:-72.0050, estimatedTime:'16:30' },
      ],
    },
    {
      name: 'Av. Ejército – Sector A',
      zoneId: zoneSantiago.id, dayOfWeek: [1,2,3,4,5], startTime: '06:30', estimatedDuration: 120,
      vehicleIdx: 9, operatorIdx: 1, wtIdxs: [1,2,4],
      wps: [
        { order:1, name:'Av. Ejército Km 0',           lat:-13.5350, lng:-71.9980, estimatedTime:'06:30' },
        { order:2, name:'Av. Ejército Km 1',           lat:-13.5380, lng:-72.0010, estimatedTime:'06:55' },
        { order:3, name:'Av. Ejército Km 2',           lat:-13.5410, lng:-72.0040, estimatedTime:'07:20' },
        { order:4, name:'Planta Sur',                  lat:-13.5500, lng:-72.0050, estimatedTime:'08:20' },
      ],
    },
    {
      name: 'Av. Ejército – Sector B',
      zoneId: zoneSantiago.id, dayOfWeek: [1,3,5], startTime: '08:00', estimatedDuration: 120,
      vehicleIdx: 10, operatorIdx: 2, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Av. Ejército Km 2',           lat:-13.5410, lng:-72.0040, estimatedTime:'08:00' },
        { order:2, name:'Av. Ejército Km 3',           lat:-13.5440, lng:-72.0070, estimatedTime:'08:25' },
        { order:3, name:'Urb. Larapa Baja',            lat:-13.5470, lng:-72.0090, estimatedTime:'08:50' },
        { order:4, name:'Planta Sur',                  lat:-13.5500, lng:-72.0050, estimatedTime:'09:50' },
      ],
    },
    {
      name: 'Urb. Bancopata',
      zoneId: zoneSantiago.id, dayOfWeek: [2,4,6], startTime: '07:00', estimatedDuration: 90,
      vehicleIdx: 13, operatorIdx: 3, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Bancopata – Entrada',         lat:-13.5460, lng:-72.0100, estimatedTime:'07:00' },
        { order:2, name:'Bancopata – Interior',        lat:-13.5480, lng:-72.0120, estimatedTime:'07:20' },
        { order:3, name:'Bancopata – Alta',            lat:-13.5500, lng:-72.0140, estimatedTime:'07:45' },
        { order:4, name:'Planta Sur',                  lat:-13.5500, lng:-72.0050, estimatedTime:'08:20' },
      ],
    },
    {
      name: 'Ttio Norte – Santiago',
      zoneId: zoneSantiago.id, dayOfWeek: [1,3,5], startTime: '07:30', estimatedDuration: 90,
      vehicleIdx: 14, operatorIdx: 4, wtIdxs: [0,1,4],
      wps: [
        { order:1, name:'Ttio – Sector A',             lat:-13.5330, lng:-72.0150, estimatedTime:'07:30' },
        { order:2, name:'Ttio – Sector B',             lat:-13.5350, lng:-72.0170, estimatedTime:'07:55' },
        { order:3, name:'Ttio – Mercadillo',           lat:-13.5370, lng:-72.0190, estimatedTime:'08:20' },
        { order:4, name:'Planta Sur',                  lat:-13.5500, lng:-72.0050, estimatedTime:'09:00' },
      ],
    },
    {
      name: 'Los Pinos – Santiago',
      zoneId: zoneSantiago.id, dayOfWeek: [2,4], startTime: '06:00', estimatedDuration: 120,
      vehicleIdx: 0, operatorIdx: 5, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Los Pinos – Entrada',         lat:-13.5480, lng:-71.9990, estimatedTime:'06:00' },
        { order:2, name:'Los Pinos – Central',         lat:-13.5510, lng:-72.0010, estimatedTime:'06:25' },
        { order:3, name:'Los Pinos – Final',           lat:-13.5540, lng:-72.0030, estimatedTime:'06:55' },
        { order:4, name:'Planta Sur',                  lat:-13.5500, lng:-72.0050, estimatedTime:'07:50' },
      ],
    },
    {
      name: 'Santiago – Barrido Sábado',
      zoneId: zoneSantiago.id, dayOfWeek: [6], startTime: '07:00', estimatedDuration: 180,
      vehicleIdx: 1, operatorIdx: 6, wtIdxs: [0,1,2,3,4],
      wps: [
        { order:1, name:'Santiago Sur – Inicio',       lat:-13.5520, lng:-72.0200, estimatedTime:'07:00' },
        { order:2, name:'Santiago Sur – Sector A',     lat:-13.5560, lng:-72.0230, estimatedTime:'07:40' },
        { order:3, name:'Santiago Sur – Sector B',     lat:-13.5600, lng:-72.0250, estimatedTime:'08:25' },
        { order:4, name:'Santiago Sur – Final',        lat:-13.5640, lng:-72.0270, estimatedTime:'09:10' },
        { order:5, name:'Planta Sur',                  lat:-13.5500, lng:-72.0050, estimatedTime:'10:00' },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // WANCHAQ  (8 rutas)
    // ══════════════════════════════════════════════════════════════════════════
    {
      name: 'Wanchaq Residencial – Mañana',
      zoneId: zoneWanchaq.id, dayOfWeek: [1,3,5], startTime: '06:00', estimatedDuration: 150,
      vehicleIdx: 2, operatorIdx: 7, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Plaza Wanchaq',               lat:-13.5310, lng:-71.9570, estimatedTime:'06:00' },
        { order:2, name:'Av. Huayruropata',            lat:-13.5320, lng:-71.9540, estimatedTime:'06:20' },
        { order:3, name:'Urb. Magisterial',            lat:-13.5340, lng:-71.9510, estimatedTime:'06:50' },
        { order:4, name:'Zarumilla',                   lat:-13.5360, lng:-71.9480, estimatedTime:'07:20' },
        { order:5, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:30' },
      ],
    },
    {
      name: 'Av. Huayruropata',
      zoneId: zoneWanchaq.id, dayOfWeek: [2,4,6], startTime: '06:30', estimatedDuration: 120,
      vehicleIdx: 3, operatorIdx: 8, wtIdxs: [1,2,4],
      wps: [
        { order:1, name:'Huayruropata – Inicio',       lat:-13.5300, lng:-71.9550, estimatedTime:'06:30' },
        { order:2, name:'Huayruropata – Centro',       lat:-13.5320, lng:-71.9530, estimatedTime:'06:55' },
        { order:3, name:'Huayruropata – Final',        lat:-13.5340, lng:-71.9510, estimatedTime:'07:20' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:10' },
      ],
    },
    {
      name: 'Urb. Magisterial',
      zoneId: zoneWanchaq.id, dayOfWeek: [1,4], startTime: '07:00', estimatedDuration: 90,
      vehicleIdx: 11, operatorIdx: 9, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Magisterial – Entrada',       lat:-13.5340, lng:-71.9510, estimatedTime:'07:00' },
        { order:2, name:'Magisterial – Central',       lat:-13.5355, lng:-71.9495, estimatedTime:'07:20' },
        { order:3, name:'Magisterial – Sector B',      lat:-13.5370, lng:-71.9480, estimatedTime:'07:45' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:20' },
      ],
    },
    {
      name: 'Urb. Zarumilla',
      zoneId: zoneWanchaq.id, dayOfWeek: [2,5], startTime: '07:00', estimatedDuration: 90,
      vehicleIdx: 12, operatorIdx: 0, wtIdxs: [0,1,4],
      wps: [
        { order:1, name:'Zarumilla Norte',             lat:-13.5360, lng:-71.9480, estimatedTime:'07:00' },
        { order:2, name:'Zarumilla Sur',               lat:-13.5380, lng:-71.9460, estimatedTime:'07:25' },
        { order:3, name:'Zarumilla Mercado',           lat:-13.5395, lng:-71.9445, estimatedTime:'07:50' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:20' },
      ],
    },
    {
      name: 'Av. Regional – Nocturno',
      zoneId: zoneWanchaq.id, dayOfWeek: [1,2,3,4,5], startTime: '19:30', estimatedDuration: 90,
      vehicleIdx: 4, operatorIdx: 1, wtIdxs: [1,2,4],
      wps: [
        { order:1, name:'Av. Regional Norte',          lat:-13.5240, lng:-71.9600, estimatedTime:'19:30' },
        { order:2, name:'Av. Regional Centro',         lat:-13.5270, lng:-71.9575, estimatedTime:'19:55' },
        { order:3, name:'Av. Regional Sur',            lat:-13.5300, lng:-71.9550, estimatedTime:'20:20' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'20:55' },
      ],
    },
    {
      name: 'Mariscal Gamarra',
      zoneId: zoneWanchaq.id, dayOfWeek: [3,6], startTime: '07:00', estimatedDuration: 120,
      vehicleIdx: 5, operatorIdx: 2, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Mariscal Gamarra A',          lat:-13.5280, lng:-71.9620, estimatedTime:'07:00' },
        { order:2, name:'Mariscal Gamarra B',          lat:-13.5295, lng:-71.9605, estimatedTime:'07:25' },
        { order:3, name:'Mariscal Gamarra C',          lat:-13.5310, lng:-71.9588, estimatedTime:'07:55' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:50' },
      ],
    },
    {
      name: 'Wanchaq Industrial',
      zoneId: zoneWanchaq.id, dayOfWeek: [1,2,3,4,5], startTime: '05:30', estimatedDuration: 120,
      vehicleIdx: 6, operatorIdx: 3, wtIdxs: [4,5],
      wps: [
        { order:1, name:'Zona Industrial A',           lat:-13.5415, lng:-71.9460, estimatedTime:'05:30' },
        { order:2, name:'Zona Industrial B',           lat:-13.5430, lng:-71.9440, estimatedTime:'05:55' },
        { order:3, name:'Zona Industrial C',           lat:-13.5445, lng:-71.9420, estimatedTime:'06:25' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'07:15' },
      ],
    },
    {
      name: 'Villa El Sol – Wanchaq',
      zoneId: zoneWanchaq.id, dayOfWeek: [2,4,6], startTime: '07:30', estimatedDuration: 90,
      vehicleIdx: 7, operatorIdx: 4, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Villa El Sol – Inicio',       lat:-13.5450, lng:-71.9490, estimatedTime:'07:30' },
        { order:2, name:'Villa El Sol – Central',      lat:-13.5465, lng:-71.9475, estimatedTime:'07:55' },
        { order:3, name:'Villa El Sol – Final',        lat:-13.5480, lng:-71.9460, estimatedTime:'08:20' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:55' },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SAN SEBASTIÁN  (8 rutas)
    // ══════════════════════════════════════════════════════════════════════════
    {
      name: 'San Sebastián Centro',
      zoneId: zoneSanSeb.id, dayOfWeek: [1,3,5], startTime: '06:00', estimatedDuration: 150,
      vehicleIdx: 8, operatorIdx: 5, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Plaza San Sebastián',         lat:-13.5540, lng:-71.9150, estimatedTime:'06:00' },
        { order:2, name:'Mercado San Sebastián',       lat:-13.5555, lng:-71.9130, estimatedTime:'06:25' },
        { order:3, name:'Av. Camino Real',             lat:-13.5570, lng:-71.9110, estimatedTime:'06:55' },
        { order:4, name:'Urb. Ttio',                   lat:-13.5590, lng:-71.9090, estimatedTime:'07:30' },
        { order:5, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:45' },
      ],
    },
    {
      name: 'Urb. Ttio – San Sebastián',
      zoneId: zoneSanSeb.id, dayOfWeek: [2,4,6], startTime: '06:30', estimatedDuration: 120,
      vehicleIdx: 9, operatorIdx: 6, wtIdxs: [0,1,4],
      wps: [
        { order:1, name:'Ttio Norte',                  lat:-13.5510, lng:-71.9200, estimatedTime:'06:30' },
        { order:2, name:'Ttio Centro',                 lat:-13.5530, lng:-71.9180, estimatedTime:'06:55' },
        { order:3, name:'Ttio Sur',                    lat:-13.5550, lng:-71.9155, estimatedTime:'07:25' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:15' },
      ],
    },
    {
      name: 'Larapa Norte',
      zoneId: zoneSanSeb.id, dayOfWeek: [1,4], startTime: '07:00', estimatedDuration: 90,
      vehicleIdx: 10, operatorIdx: 7, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Larapa Norte – Entrada',      lat:-13.5480, lng:-71.9250, estimatedTime:'07:00' },
        { order:2, name:'Larapa Norte – Central',      lat:-13.5495, lng:-71.9230, estimatedTime:'07:25' },
        { order:3, name:'Larapa Norte – Final',        lat:-13.5510, lng:-71.9210, estimatedTime:'07:50' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:25' },
      ],
    },
    {
      name: 'Larapa Sur',
      zoneId: zoneSanSeb.id, dayOfWeek: [2,5], startTime: '07:00', estimatedDuration: 90,
      vehicleIdx: 11, operatorIdx: 8, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Larapa Sur – Entrada',        lat:-13.5570, lng:-71.9220, estimatedTime:'07:00' },
        { order:2, name:'Larapa Sur – Central',        lat:-13.5590, lng:-71.9200, estimatedTime:'07:25' },
        { order:3, name:'Larapa Sur – Baja',           lat:-13.5610, lng:-71.9180, estimatedTime:'07:50' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:25' },
      ],
    },
    {
      name: 'Huancaro – Sector A',
      zoneId: zoneSanSeb.id, dayOfWeek: [1,3,5], startTime: '07:30', estimatedDuration: 120,
      vehicleIdx: 12, operatorIdx: 9, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Huancaro A – Entrada',        lat:-13.5600, lng:-71.9100, estimatedTime:'07:30' },
        { order:2, name:'Huancaro A – Central',        lat:-13.5620, lng:-71.9080, estimatedTime:'07:55' },
        { order:3, name:'Huancaro A – Final',          lat:-13.5640, lng:-71.9060, estimatedTime:'08:25' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'09:20' },
      ],
    },
    {
      name: 'Huancaro – Sector B',
      zoneId: zoneSanSeb.id, dayOfWeek: [2,4,6], startTime: '07:30', estimatedDuration: 120,
      vehicleIdx: 13, operatorIdx: 0, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Huancaro B – Entrada',        lat:-13.5650, lng:-71.9060, estimatedTime:'07:30' },
        { order:2, name:'Huancaro B – Central',        lat:-13.5665, lng:-71.9040, estimatedTime:'07:55' },
        { order:3, name:'Huancaro B – Final',          lat:-13.5680, lng:-71.9020, estimatedTime:'08:25' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'09:20' },
      ],
    },
    {
      name: 'Av. Camino Real – Nocturno',
      zoneId: zoneSanSeb.id, dayOfWeek: [1,2,3,4,5], startTime: '20:00', estimatedDuration: 90,
      vehicleIdx: 14, operatorIdx: 1, wtIdxs: [1,2,4],
      wps: [
        { order:1, name:'Camino Real Km 0',            lat:-13.5520, lng:-71.9140, estimatedTime:'20:00' },
        { order:2, name:'Camino Real Km 1',            lat:-13.5540, lng:-71.9120, estimatedTime:'20:20' },
        { order:3, name:'Camino Real Km 2',            lat:-13.5560, lng:-71.9100, estimatedTime:'20:45' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'21:25' },
      ],
    },
    {
      name: 'Nuevo Horizonte',
      zoneId: zoneSanSeb.id, dayOfWeek: [3,6], startTime: '07:00', estimatedDuration: 120,
      vehicleIdx: 0, operatorIdx: 2, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Nuevo Horizonte A',           lat:-13.5620, lng:-71.9170, estimatedTime:'07:00' },
        { order:2, name:'Nuevo Horizonte B',           lat:-13.5640, lng:-71.9150, estimatedTime:'07:25' },
        { order:3, name:'Nuevo Horizonte C',           lat:-13.5660, lng:-71.9130, estimatedTime:'07:55' },
        { order:4, name:'Planta Este',                 lat:-13.5400, lng:-71.9420, estimatedTime:'08:50' },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SAN JERÓNIMO  (8 rutas)
    // ══════════════════════════════════════════════════════════════════════════
    {
      name: 'San Jerónimo Centro',
      zoneId: zoneSanJer.id, dayOfWeek: [1,3,5], startTime: '06:00', estimatedDuration: 180,
      vehicleIdx: 1, operatorIdx: 3, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Plaza San Jerónimo',          lat:-13.5760, lng:-71.8750, estimatedTime:'06:00' },
        { order:2, name:'Mercado San Jerónimo',        lat:-13.5775, lng:-71.8730, estimatedTime:'06:25' },
        { order:3, name:'Av. Los Incas',               lat:-13.5790, lng:-71.8710, estimatedTime:'07:00' },
        { order:4, name:'Angostura',                   lat:-13.5810, lng:-71.8690, estimatedTime:'07:40' },
        { order:5, name:'Planta Sureste',              lat:-13.5850, lng:-71.8650, estimatedTime:'08:55' },
      ],
    },
    {
      name: 'Urb. Angostura',
      zoneId: zoneSanJer.id, dayOfWeek: [2,4,6], startTime: '06:30', estimatedDuration: 120,
      vehicleIdx: 2, operatorIdx: 4, wtIdxs: [0,1,4],
      wps: [
        { order:1, name:'Angostura A',                 lat:-13.5800, lng:-71.8700, estimatedTime:'06:30' },
        { order:2, name:'Angostura B',                 lat:-13.5820, lng:-71.8680, estimatedTime:'06:55' },
        { order:3, name:'Angostura C',                 lat:-13.5840, lng:-71.8660, estimatedTime:'07:25' },
        { order:4, name:'Planta Sureste',              lat:-13.5850, lng:-71.8650, estimatedTime:'08:10' },
      ],
    },
    {
      name: 'Conchacalle',
      zoneId: zoneSanJer.id, dayOfWeek: [1,4], startTime: '07:00', estimatedDuration: 90,
      vehicleIdx: 3, operatorIdx: 5, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Conchacalle Norte',           lat:-13.5700, lng:-71.8800, estimatedTime:'07:00' },
        { order:2, name:'Conchacalle Sur',             lat:-13.5720, lng:-71.8780, estimatedTime:'07:25' },
        { order:3, name:'Conchacalle Baja',            lat:-13.5740, lng:-71.8760, estimatedTime:'07:50' },
        { order:4, name:'Planta Sureste',              lat:-13.5850, lng:-71.8650, estimatedTime:'08:30' },
      ],
    },
    {
      name: 'Saylla y Acceso Valle',
      zoneId: zoneSanJer.id, dayOfWeek: [2,5], startTime: '06:00', estimatedDuration: 150,
      vehicleIdx: 4, operatorIdx: 6, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Saylla Centro',               lat:-13.5880, lng:-71.8620, estimatedTime:'06:00' },
        { order:2, name:'Saylla Baja',                 lat:-13.5900, lng:-71.8600, estimatedTime:'06:30' },
        { order:3, name:'Acceso Principal',            lat:-13.5920, lng:-71.8580, estimatedTime:'07:05' },
        { order:4, name:'Planta Sureste',              lat:-13.5850, lng:-71.8650, estimatedTime:'08:25' },
      ],
    },
    {
      name: 'Av. Los Incas Sur – Nocturno',
      zoneId: zoneSanJer.id, dayOfWeek: [1,2,3,4,5], startTime: '19:00', estimatedDuration: 90,
      vehicleIdx: 5, operatorIdx: 7, wtIdxs: [1,2,4],
      wps: [
        { order:1, name:'Los Incas Km 0',              lat:-13.5700, lng:-71.8820, estimatedTime:'19:00' },
        { order:2, name:'Los Incas Km 1',              lat:-13.5730, lng:-71.8790, estimatedTime:'19:20' },
        { order:3, name:'Los Incas Km 2',              lat:-13.5760, lng:-71.8760, estimatedTime:'19:45' },
        { order:4, name:'Planta Sureste',              lat:-13.5850, lng:-71.8650, estimatedTime:'20:20' },
      ],
    },
    {
      name: 'Huasao – Sector A',
      zoneId: zoneSanJer.id, dayOfWeek: [3,6], startTime: '07:00', estimatedDuration: 120,
      vehicleIdx: 6, operatorIdx: 8, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Huasao – Entrada',            lat:-13.5840, lng:-71.8700, estimatedTime:'07:00' },
        { order:2, name:'Huasao – Centro',             lat:-13.5860, lng:-71.8680, estimatedTime:'07:30' },
        { order:3, name:'Huasao – Final',              lat:-13.5880, lng:-71.8660, estimatedTime:'08:00' },
        { order:4, name:'Planta Sureste',              lat:-13.5850, lng:-71.8650, estimatedTime:'08:50' },
      ],
    },
    {
      name: 'San Jerónimo Industrial',
      zoneId: zoneSanJer.id, dayOfWeek: [1,2,3,4,5], startTime: '05:30', estimatedDuration: 120,
      vehicleIdx: 7, operatorIdx: 9, wtIdxs: [4,5],
      wps: [
        { order:1, name:'Industrial A',                lat:-13.5740, lng:-71.8780, estimatedTime:'05:30' },
        { order:2, name:'Industrial B',                lat:-13.5760, lng:-71.8760, estimatedTime:'05:55' },
        { order:3, name:'Industrial C',                lat:-13.5780, lng:-71.8740, estimatedTime:'06:25' },
        { order:4, name:'Planta Sureste',              lat:-13.5850, lng:-71.8650, estimatedTime:'07:15' },
      ],
    },
    {
      name: 'Valle Sagrado – Acceso',
      zoneId: zoneSanJer.id, dayOfWeek: [6], startTime: '07:30', estimatedDuration: 180,
      vehicleIdx: 8, operatorIdx: 0, wtIdxs: [0,1,2,4],
      wps: [
        { order:1, name:'Valle Sagrado Km 1',          lat:-13.5680, lng:-71.8840, estimatedTime:'07:30' },
        { order:2, name:'Valle Sagrado Km 2',          lat:-13.5660, lng:-71.8860, estimatedTime:'08:10' },
        { order:3, name:'Valle Sagrado Km 3',          lat:-13.5640, lng:-71.8880, estimatedTime:'08:55' },
        { order:4, name:'Planta Sureste',              lat:-13.5850, lng:-71.8650, estimatedTime:'10:15' },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // POROY  (9 rutas)
    // ══════════════════════════════════════════════════════════════════════════
    {
      name: 'Poroy Centro',
      zoneId: zonePoroy.id, dayOfWeek: [1,3,5], startTime: '07:00', estimatedDuration: 120,
      vehicleIdx: 9, operatorIdx: 1, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Plaza Poroy',                 lat:-13.4480, lng:-72.0850, estimatedTime:'07:00' },
        { order:2, name:'Poroy – Mercado',             lat:-13.4495, lng:-72.0830, estimatedTime:'07:25' },
        { order:3, name:'Poroy – Residencial',         lat:-13.4510, lng:-72.0810, estimatedTime:'07:55' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'08:50' },
      ],
    },
    {
      name: 'Urb. Villa Consuelo',
      zoneId: zonePoroy.id, dayOfWeek: [2,4,6], startTime: '07:00', estimatedDuration: 90,
      vehicleIdx: 10, operatorIdx: 2, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Villa Consuelo A',            lat:-13.4420, lng:-72.0900, estimatedTime:'07:00' },
        { order:2, name:'Villa Consuelo B',            lat:-13.4440, lng:-72.0880, estimatedTime:'07:25' },
        { order:3, name:'Villa Consuelo C',            lat:-13.4460, lng:-72.0860, estimatedTime:'07:50' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'08:25' },
      ],
    },
    {
      name: 'Huaynacapac – Poroy',
      zoneId: zonePoroy.id, dayOfWeek: [1,4], startTime: '06:30', estimatedDuration: 120,
      vehicleIdx: 11, operatorIdx: 3, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Huaynacapac Norte',           lat:-13.4380, lng:-72.0820, estimatedTime:'06:30' },
        { order:2, name:'Huaynacapac Sur',             lat:-13.4400, lng:-72.0800, estimatedTime:'06:55' },
        { order:3, name:'Huaynacapac Baja',            lat:-13.4420, lng:-72.0780, estimatedTime:'07:25' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'08:10' },
      ],
    },
    {
      name: 'Qoricocha Sector',
      zoneId: zonePoroy.id, dayOfWeek: [2,5], startTime: '07:30', estimatedDuration: 90,
      vehicleIdx: 12, operatorIdx: 4, wtIdxs: [0,1,4],
      wps: [
        { order:1, name:'Qoricocha A',                 lat:-13.4350, lng:-72.0950, estimatedTime:'07:30' },
        { order:2, name:'Qoricocha B',                 lat:-13.4370, lng:-72.0920, estimatedTime:'07:55' },
        { order:3, name:'Qoricocha C',                 lat:-13.4390, lng:-72.0900, estimatedTime:'08:20' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'08:55' },
      ],
    },
    {
      name: 'Poroy Alto',
      zoneId: zonePoroy.id, dayOfWeek: [3,6], startTime: '07:00', estimatedDuration: 120,
      vehicleIdx: 13, operatorIdx: 5, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Poroy Alto A',                lat:-13.4290, lng:-72.0870, estimatedTime:'07:00' },
        { order:2, name:'Poroy Alto B',                lat:-13.4310, lng:-72.0850, estimatedTime:'07:30' },
        { order:3, name:'Poroy Alto C',                lat:-13.4330, lng:-72.0830, estimatedTime:'08:00' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'08:55' },
      ],
    },
    {
      name: 'Cotahuacho',
      zoneId: zonePoroy.id, dayOfWeek: [1,3,5], startTime: '08:00', estimatedDuration: 90,
      vehicleIdx: 14, operatorIdx: 6, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Cotahuacho Norte',            lat:-13.4540, lng:-72.0950, estimatedTime:'08:00' },
        { order:2, name:'Cotahuacho Sur',              lat:-13.4560, lng:-72.0930, estimatedTime:'08:25' },
        { order:3, name:'Cotahuacho Baja',             lat:-13.4580, lng:-72.0910, estimatedTime:'08:50' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'09:25' },
      ],
    },
    {
      name: 'Puquin Sector A',
      zoneId: zonePoroy.id, dayOfWeek: [2,4], startTime: '07:00', estimatedDuration: 90,
      vehicleIdx: 0, operatorIdx: 7, wtIdxs: [0,4],
      wps: [
        { order:1, name:'Puquin A',                    lat:-13.4600, lng:-72.0820, estimatedTime:'07:00' },
        { order:2, name:'Puquin B',                    lat:-13.4620, lng:-72.0800, estimatedTime:'07:25' },
        { order:3, name:'Puquin C',                    lat:-13.4640, lng:-72.0780, estimatedTime:'07:50' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'08:20' },
      ],
    },
    {
      name: 'Cachimayo – Sábados',
      zoneId: zonePoroy.id, dayOfWeek: [6], startTime: '07:30', estimatedDuration: 150,
      vehicleIdx: 1, operatorIdx: 8, wtIdxs: [0,1,2,4],
      wps: [
        { order:1, name:'Cachimayo Norte',             lat:-13.4160, lng:-72.1050, estimatedTime:'07:30' },
        { order:2, name:'Cachimayo Centro',            lat:-13.4180, lng:-72.1020, estimatedTime:'08:05' },
        { order:3, name:'Cachimayo Sur',               lat:-13.4200, lng:-72.0990, estimatedTime:'08:45' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'09:55' },
      ],
    },
    {
      name: 'Estación Poroy – Entorno',
      zoneId: zonePoroy.id, dayOfWeek: [1,2,3,4,5], startTime: '06:00', estimatedDuration: 90,
      vehicleIdx: 2, operatorIdx: 9, wtIdxs: [0,1,4],
      wps: [
        { order:1, name:'Estación Ferroviaria',        lat:-13.4490, lng:-72.0830, estimatedTime:'06:00' },
        { order:2, name:'Entorno Estación A',          lat:-13.4505, lng:-72.0815, estimatedTime:'06:20' },
        { order:3, name:'Entorno Estación B',          lat:-13.4520, lng:-72.0800, estimatedTime:'06:45' },
        { order:4, name:'Planta Noroeste',             lat:-13.4550, lng:-72.0780, estimatedTime:'07:20' },
      ],
    },
  ]

  // Crear rutas con waypoints y tipos de residuos
  let routeCount = 0
  for (const rd of routesData) {
    const { wps, vehicleIdx, operatorIdx, wtIdxs, ...routeFields } = rd

    const route = await prisma.route.create({
      data: {
        ...routeFields,
        status: 'ACTIVE',
        vehicleId:  vehicles[vehicleIdx].id,
        operatorId: operators[operatorIdx].id,
        createdById: admin.id,
      },
    })

    await prisma.waypoint.createMany({
      data: wps.map((wp) => ({ ...wp, routeId: route.id })),
    })

    await prisma.routeWasteType.createMany({
      data: wtIdxs.map((i) => ({ routeId: route.id, wasteTypeId: wasteTypes[i].id })),
    })

    routeCount++
  }

  console.log('✅ Rutas creadas:', routeCount)
  console.log('\n🎉 Seed completado exitosamente!')
  console.log('──────────────────────────────────────────────────────')
  console.log('📧 Admin    : 204805@unsaac.edu.pe  / Admin2024@')
  console.log('📧 Operador : cmamani@ecorutas.pe   / Operador2024@')
  console.log('         (y 9 operadores más con el mismo patrón)')
  console.log('──────────────────────────────────────────────────────')
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); (globalThis as any).process?.exit(1) })
  .finally(() => prisma.$disconnect())
