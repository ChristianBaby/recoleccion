import { pointInPolygon } from '../../src/utils/geoUtils';
import { createZone } from '../../src/services/zone.service';
import { prisma } from '../../src/config/prisma';

// Mock de Prisma Client
jest.mock('../../src/config/prisma', () => ({
  prisma: {
    zone: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Pruebas Unitarias de Geolocalización - Punto en Polígono (HU-01 y HU-03)', () => {
  const testPolygonRing: [number, number][] = [
    [-71.9700, -13.5200],
    [-71.9500, -13.5200],
    [-71.9500, -13.5400],
    [-71.9700, -13.5400],
    [-71.9700, -13.5200],
  ];

  it('Debe retornar true si el punto (coordenadas del ciudadano) está dentro del polígono', () => {
    const latInside = -13.5300;
    const lngInside = -71.9600;
    const result = pointInPolygon(latInside, lngInside, testPolygonRing);
    expect(result).toBe(true);
  });

  it('Debe retornar false si el punto está fuera del polígono (al norte)', () => {
    const latOutside = -13.5000;
    const lngOutside = -71.9600;
    const result = pointInPolygon(latOutside, lngOutside, testPolygonRing);
    expect(result).toBe(false);
  });

  it('Debe retornar false si el punto está fuera del polígono (al este)', () => {
    const latOutside = -13.5300;
    const lngOutside = -71.9400;
    const result = pointInPolygon(latOutside, lngOutside, testPolygonRing);
    expect(result).toBe(false);
  });
});

describe('Pruebas de Servicio CRUD de Zonas - Reglas de Negocio (HU-03)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe crear la zona exitosamente si el nombre no existe', async () => {
    (prisma.zone.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.zone.create as jest.Mock).mockResolvedValue({ id: 'zone-123', name: 'Zona Cusco Centro' });

    const input = {
      name: 'Zona Cusco Centro',
      description: 'Sector histórico de Cusco',
      district: 'Cusco',
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-71.9700, -13.5200],
            [-71.9500, -13.5200],
            [-71.9500, -13.5400],
            [-71.9700, -13.5400],
            [-71.9700, -13.5200],
          ] as [number, number][],
        ] as [number, number][][],
      },
    };

    const result = await createZone(input, 'admin-uuid-001');

    expect(result).toBeDefined();
    expect(result.name).toBe('Zona Cusco Centro');
    expect(prisma.zone.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        description: input.description,
        district: input.district,
        color: '#22c55e', // Color por defecto configurado en backend
        geometry: input.geometry,
        createdById: 'admin-uuid-001',
      },
    });
  });

  it('Debe lanzar error 409 si el nombre de la zona ya existe en la base de datos', async () => {
    (prisma.zone.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-zone-id', name: 'Zona Duplicada' });

    const input = {
      name: 'Zona Duplicada',
      district: 'Wanchaq',
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-71.9700, -13.5200],
            [-71.9500, -13.5200],
            [-71.9500, -13.5400],
            [-71.9700, -13.5400],
            [-71.9700, -13.5200],
          ] as [number, number][],
        ] as [number, number][][],
      },
    };

    await expect(createZone(input, 'admin-uuid-001')).rejects.toEqual({
      status: 409,
      message: 'Ya existe una zona con ese nombre',
    });

    expect(prisma.zone.create).not.toHaveBeenCalled();
  });
});
