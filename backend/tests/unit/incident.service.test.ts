import { createIncident, getIncident, updateIncidentStatus } from '../../src/services/incident.service';
import { prisma } from '../../src/config/prisma';

// Mock de Prisma Client
jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    incident: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock de nodemailer/email.service
jest.mock('../../src/services/email.service', () => ({
  sendIncidentStatusEmail: jest.fn().mockResolvedValue(true),
}));

describe('Pruebas del Servicio de Reporte de Incidencias - HU-08 (RF-11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe crear una incidencia exitosamente generando un codigo en formato INC-YYYY-XXXXX', async () => {
    // Ciudadano con zona asignada
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'citizen-123', zoneId: 'zone-123' });
    
    // Mock de buscar por codigo unico (para el bucle de generacion)
    (prisma.incident.findUnique as jest.Mock).mockResolvedValue(null);

    const mockCreatedIncident = {
      id: 'inc-001',
      type: 'WASTE_ACCUMULATION',
      description: 'Gran acumulacion de plasticos en la esquina',
      status: 'OPEN',
      trackingCode: 'INC-2026-12345',
      lat: -13.52,
      lng: -71.96,
      address: 'Av. de la Cultura 123',
      createdAt: new Date(),
    };
    (prisma.incident.create as jest.Mock).mockResolvedValue(mockCreatedIncident);

    const result = await createIncident({
      type: 'WASTE_ACCUMULATION',
      description: 'Gran acumulacion de plasticos en la esquina',
      imageUrl: 'http://cdn.com/foto.jpg',
      lat: -13.52,
      lng: -71.96,
      address: 'Av. de la Cultura 123',
    }, 'citizen-123');

    expect(result).toBeDefined();
    expect(result.trackingCode).toMatch(/^INC-\d{4}-\d{5}$/);
    expect(prisma.incident.create).toHaveBeenCalled();
  });

  it('Debe rechazar la creacion con error 403 si el ciudadano no tiene zona asignada', async () => {
    // Ciudadano sin zona asignada (zoneId: null, role: 'CITIZEN')
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'citizen-123', zoneId: null, role: 'CITIZEN' });

    await expect(createIncident({
      type: 'DAMAGED_CONTAINER',
      description: 'Tapa rota',
      imageUrl: undefined,
      lat: -13.52,
      lng: -71.96,
      address: 'Calle Cusco 456',
    }, 'citizen-123')).rejects.toEqual({
      status: 403,
      message: 'Debes tener una zona asignada para reportar incidencias',
    });

    expect(prisma.incident.create).not.toHaveBeenCalled();
  });

  it('Debe permitir crear una incidencia exitosamente a un Administrador que no tiene zona asignada', async () => {
    // Admin sin zona asignada (zoneId: null, role: 'ADMIN')
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'admin-123', zoneId: null, role: 'ADMIN' });
    
    // Mock de buscar por codigo unico (para el bucle de generacion)
    (prisma.incident.findUnique as jest.Mock).mockResolvedValue(null);

    const mockCreatedIncident = {
      id: 'inc-002',
      type: 'WASTE_ACCUMULATION',
      description: 'Reporte registrado por el administrador del sistema',
      status: 'OPEN',
      trackingCode: 'INC-2026-54321',
      lat: -13.52,
      lng: -71.96,
      address: 'Plaza de Armas Cusco',
      createdAt: new Date(),
    };
    (prisma.incident.create as jest.Mock).mockResolvedValue(mockCreatedIncident);

    const result = await createIncident({
      type: 'WASTE_ACCUMULATION',
      description: 'Reporte registrado por el administrador del sistema',
      imageUrl: undefined,
      lat: -13.52,
      lng: -71.96,
      address: 'Plaza de Armas Cusco',
    }, 'admin-123');

    expect(result).toBeDefined();
    expect(result.trackingCode).toMatch(/^INC-\d{4}-\d{5}$/);
    expect(prisma.incident.create).toHaveBeenCalled();
  });

  it('Debe lanzar error 403 si un ciudadano intenta obtener una incidencia ajena', async () => {
    const mockIncident = {
      id: 'inc-001',
      citizenId: 'citizen-123',
      type: 'WASTE_ACCUMULATION',
      description: 'Reporte ajeno',
    };
    (prisma.incident.findUnique as jest.Mock).mockResolvedValue(mockIncident);

    // Intenta consultar la incidencia el ciudadano-456 (no el creador citizen-123)
    await expect(getIncident('inc-001', 'citizen-456', 'CITIZEN')).rejects.toEqual({
      status: 403,
      message: 'No tienes permiso para ver esta incidencia',
    });
  });

  it('Debe permitir actualizar el estado de una incidencia y simular el envio de correo (ADMIN)', async () => {
    const mockIncident = {
      id: 'inc-001',
      trackingCode: 'INC-2026-12345',
      citizenId: 'citizen-123',
      citizen: {
        email: 'ciudadano@test.com',
        firstName: 'Carlos',
      },
    };
    (prisma.incident.findUnique as jest.Mock).mockResolvedValue(mockIncident);
    (prisma.incident.update as jest.Mock).mockResolvedValue({
      id: 'inc-001',
      status: 'RESOLVED',
    });

    const result = await updateIncidentStatus('inc-001', { status: 'RESOLVED' });

    expect(result).toBeDefined();
    expect(result.status).toBe('RESOLVED');
    expect(prisma.incident.update).toHaveBeenCalledWith({
      where: { id: 'inc-001' },
      data: { status: 'RESOLVED' },
    });
  });
});
