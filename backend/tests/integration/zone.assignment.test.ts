import { assignZoneToUser } from '../../src/services/zone.service';
import { prisma } from '../../src/config/prisma';

// Mock de Prisma Client
jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
    zone: {
      findMany: jest.fn(),
    },
  },
}));

describe('Pruebas Unitarias de Asignación de Usuarios a Zonas (HU-04)', () => {
  const userId = 'user-uuid-123';
  const lat = -13.5300;
  const lng = -71.9600;

  // Zona activa Cusco de prueba
  const mockActiveZone = {
    id: 'zone-uuid-abc',
    name: 'Zona Cusco Centro',
    isActive: true,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-71.9700, -13.5200],
          [-71.9500, -13.5200],
          [-71.9500, -13.5400],
          [-71.9700, -13.5400],
          [-71.9700, -13.5200],
        ],
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe asignar al ciudadano la zona detectada y guardar sus coordenadas de domicilio si las coordenadas recaen dentro del polígono', async () => {
    (prisma.zone.findMany as jest.Mock).mockResolvedValue([mockActiveZone]);
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const result = await assignZoneToUser(userId, lat, lng);

    expect(result).toBeDefined();
    expect(result?.id).toBe('zone-uuid-abc');
    expect(prisma.zone.findMany).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        zoneId: 'zone-uuid-abc',
        homeLat: lat,
        homeLng: lng,
      },
    });
  });

  it('Debe asignar zoneId como null (pendiente) si las coordenadas están fuera de cobertura de toda zona activa', async () => {
    // Retornamos la zona de prueba, pero evaluamos un punto geográficamente lejano (fuera del polígono)
    (prisma.zone.findMany as jest.Mock).mockResolvedValue([mockActiveZone]);
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const outsideLat = -13.5000; // Fuera del polígono
    const result = await assignZoneToUser(userId, outsideLat, lng);

    expect(result).toBeNull();
    expect(prisma.zone.findMany).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        zoneId: null, // Asignación pendiente
        homeLat: outsideLat,
        homeLng: lng,
      },
    });
  });
});
