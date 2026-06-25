import { setupTrackingHandlers } from '../../src/socket/tracking';
import { prisma } from '../../src/config/prisma';
import { sendRouteDelayEmail } from '../../src/services/email.service';

jest.mock('../../src/services/email.service', () => ({
  sendRouteDelayEmail: jest.fn().mockResolvedValue(undefined),
}));

// Mock de Prisma Client
jest.mock('../../src/config/prisma', () => ({
  prisma: {
    route: {
      findUnique: jest.fn(),
    },
    routeExecution: {
      create: jest.fn(),
      update: jest.fn(),
    },
    gpsTrack: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

describe('Pruebas de Rastreo GPS en Tiempo Real y Privacidad del Conductor - HU-06 (RF-08)', () => {
  let mockSocket: any;
  let mockServer: any;
  let eventCallbacks: { [key: string]: Function };
  let joinedRooms: string[];
  let emittedEvents: { room: string; event: string; data: any }[];

  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    joinedRooms = [];
    emittedEvents = [];

    // Mock del Socket de Socket.IO
    mockSocket = {
      id: 'socket-operator-123',
      data: {
        user: {
          id: 'user-op-01',
          email: 'operator@ecorutas.com',
          role: 'OPERATOR',
          name: 'Edmil Saire',
        },
      },
      join: jest.fn((room: string) => {
        joinedRooms.push(room);
      }),
      on: jest.fn((event: string, callback: Function) => {
        eventCallbacks[event] = callback;
      }),
      emit: jest.fn((event: string, data: any) => {
        emittedEvents.push({ room: '', event, data });
      }),
    };

    // Mock del Server de Socket.IO
    mockServer = {
      to: jest.fn((room: string) => ({
        emit: jest.fn((event: string, data: any) => {
          emittedEvents.push({ room, event, data });
        }),
      })),
    };

    setupTrackingHandlers(mockServer, mockSocket);
  });

  it('Debe inicializar correctamente y registrar los event handlers', () => {
    expect(mockSocket.on).toHaveBeenCalledWith('tracking:start', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('tracking:position', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('tracking:subscribe', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  it('Debe unirse a la sala del distrito y emitir inicio al recibir tracking:start con routeId', async () => {
    const mockRoute = { id: 'route-111', zoneId: 'zone-123', vehicleId: 'veh-01', vehicle: { plate: 'CUZ-001' } };
    (prisma.route.findUnique as jest.Mock).mockResolvedValue(mockRoute);
    (prisma.routeExecution.create as jest.Mock).mockResolvedValue({ id: 'exec-999' });

    // Ejecutar el handler de inicio
    await eventCallbacks['tracking:start']({ routeId: 'route-111' });

    expect(joinedRooms).toContain('zone:zone-123');
    expect(mockSocket.data.routeId).toBe('route-111');
    expect(mockSocket.data.zoneId).toBe('zone-123');
    expect(mockSocket.data.executionId).toBe('exec-999');

    const startedEvent = emittedEvents.find(e => e.event === 'tracking:started');
    expect(startedEvent).toBeDefined();
    expect(startedEvent?.data.executionId).toBe('exec-999');
  });

  it('Debe transmitir la posicion anonimizando al conductor para ciudadanos y manteniendo datos reales para administradores (RF-08)', async () => {
    // Simulamos que el socket ya inicio tracking y guardo zona
    mockSocket.data.zoneId = 'zone-123';
    mockSocket.data.routeId = 'route-111';
    mockSocket.data.vehicleCode = 'CUZ-001';

    // Ejecutar handler de posicion
    await eventCallbacks['tracking:position']({
      lat: -13.525,
      lng: -71.965,
      speed: 25,
      heading: 180,
    });

    // 1. Verificar difusion a la sala de ciudadanos (anonimizada)
    const citizenUpdate = emittedEvents.find(e => e.room === 'zone:zone-123' && e.event === 'tracking:truck_update');
    expect(citizenUpdate).toBeDefined();
    expect(citizenUpdate?.data.operatorName).toBe('Operador Autorizado');
    expect(citizenUpdate?.data.lat).toBe(-13.525);
    expect(citizenUpdate?.data.lng).toBe(-71.965);

    // 2. Verificar difusion a la sala de administracion (con nombre real del conductor)
    const adminUpdate = emittedEvents.find(e => e.room === 'admin_room' && e.event === 'tracking:truck_update');
    expect(adminUpdate).toBeDefined();
    expect(adminUpdate?.data.operatorName).toBe('Edmil Saire'); // Nombre real del operador
    expect(adminUpdate?.data.lat).toBe(-13.525);
  });

  it('Debe emitir la alerta de proximidad cuando el camion esta dentro del radio del ciudadano (HU-12)', async () => {
    // Mockear findMany para retornar un ciudadano en la misma zona
    const mockCitizens = [
      { id: 'citizen-111', homeLat: -13.525, homeLng: -71.965, alertRadius: 500 }
    ];
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockCitizens);

    // Inicializar el socket con datos de zona
    mockSocket.data.zoneId = 'zone-123';
    mockSocket.data.routeId = 'route-111';
    mockSocket.data.vehicleCode = 'CUZ-001';

    // Ejecutar handler de posicion
    await eventCallbacks['tracking:position']({
      lat: -13.525,
      lng: -71.965,
      speed: 20,
      heading: 90,
    });

    // Esperar a que la promesa asincrona de checkProximityAlerts se resuelva
    // (ya que checkProximityAlerts se ejecuta asincronamente en el handler de posicion)
    await new Promise(resolve => setTimeout(resolve, 50));

    const proximityAlert = emittedEvents.find(e => e.room === 'user:citizen-111' && e.event === 'proximity:alert');
    expect(proximityAlert).toBeDefined();
    expect(proximityAlert?.data.distance).toBe(0);
    expect(proximityAlert?.data.vehicleCode).toBe('CUZ-001');
    expect(proximityAlert?.data.operatorName).toBeUndefined();
  });

  it('Debe actualizar el estado de la ejecucion a DELAYED y emitir alerta de retraso (HU-13)', async () => {
    const mockExecution = {
      id: 'exec-999',
      route: { name: 'Ruta Centro' }
    };
    (prisma.routeExecution.update as jest.Mock).mockResolvedValue(mockExecution);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'citizen-1', email: 'vecino1@poroy.gob.pe', firstName: 'Ana' },
      { id: 'citizen-2', email: 'vecino2@poroy.gob.pe', firstName: 'Luis' },
    ]);

    mockSocket.data.executionId = 'exec-999';
    mockSocket.data.zoneId = 'zone-123';

    // Ejecutar handler de reporte de retraso
    await eventCallbacks['tracking:report_delay']({
      delayMinutes: 20,
      reason: 'Trafico intenso en Av. Sol',
    });

    expect(prisma.routeExecution.update).toHaveBeenCalledWith({
      where: { id: 'exec-999' },
      data: { status: 'DELAYED', delayMinutes: 20, notes: 'Trafico intenso en Av. Sol' },
      include: { route: { select: { name: true } } },
    });

    const delayAlert = emittedEvents.find(e => e.room === 'zone:zone-123' && e.event === 'route:delay_alert');
    expect(delayAlert).toBeDefined();
    expect(delayAlert?.data.routeName).toBe('Ruta Centro');
    expect(delayAlert?.data.delayMinutes).toBe(20);
    expect(delayAlert?.data.reason).toBe('Trafico intenso en Av. Sol');
    expect(sendRouteDelayEmail).toHaveBeenCalledTimes(2);
    expect(sendRouteDelayEmail).toHaveBeenCalledWith(
      'vecino1@poroy.gob.pe',
      'Ana',
      'Ruta Centro',
      20,
      'Trafico intenso en Av. Sol',
    );
  });
});

