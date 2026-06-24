import { createZoneSchema } from '../../src/validators/zone.validator';

describe('Pruebas Unitarias de Zonas - Esquema de Validacion GeoJSON (HU-03)', () => {
  const validGeometry = {
    type: 'Polygon',
    coordinates: [
      [
        [-71.9700, -13.5200],
        [-71.9500, -13.5200],
        [-71.9500, -13.5400],
        [-71.9700, -13.5400],
        [-71.9700, -13.5200], // Cierre (4 puntos mínimos + 1 de cierre)
      ],
    ],
  };

  const baseValidInput = {
    name: 'Zona Cusco Centro',
    description: 'Sector monumental e histórico',
    district: 'Cusco',
    color: '#ff5733',
    geometry: validGeometry,
  };

  it('Debe validar exitosamente con un GeoJSON y atributos correctos', () => {
    const result = createZoneSchema.safeParse(baseValidInput);
    expect(result.success).toBe(true);
  });

  it('Debe fallar si el nombre de la zona es demasiado corto', () => {
    const invalidInput = { ...baseValidInput, name: 'Z' };
    const result = createZoneSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.errors.find((e) => e.path.includes('name'));
      expect(nameError).toBeDefined();
      expect(nameError?.message).toBe('Mínimo 2 caracteres');
    }
  });

  it('Debe fallar si el tipo de geometria no es Polygon', () => {
    const invalidInput = {
      ...baseValidInput,
      geometry: { ...validGeometry, type: 'Point' }, // Tipo no Polygon
    };
    const result = createZoneSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('Debe fallar si el anillo del poligono tiene menos de 4 puntos', () => {
    const invalidInput = {
      ...baseValidInput,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-71.9700, -13.5200],
            [-71.9500, -13.5200],
            [-71.9700, -13.5200], // Solo 3 puntos, inválido
          ],
        ],
      },
    };
    const result = createZoneSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const geomError = result.error.errors.find((e) => e.message.includes('El polígono debe tener al menos 4 puntos'));
      expect(geomError).toBeDefined();
    }
  });

  it('Debe fallar si el color no es un formato hexadecimal valido', () => {
    const invalidInput = { ...baseValidInput, color: 'rojo-fuerte' };
    const result = createZoneSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const colorError = result.error.errors.find((e) => e.path.includes('color'));
      expect(colorError).toBeDefined();
      expect(colorError?.message).toBe('Color hex inválido');
    }
  });
});
