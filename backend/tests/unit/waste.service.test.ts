import { createWasteType, getWasteType, listWasteTypes, updateWasteType, toggleWasteTypeStatus } from '../../src/services/waste.service';
import { createWasteTypeSchema, updateWasteTypeSchema } from '../../src/validators/waste.validator';
import { prisma } from '../../src/config/prisma';

// Mock de Prisma Client
jest.mock('../../src/config/prisma', () => ({
  prisma: {
    wasteType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Pruebas Unitarias de Validacion de Residuos - Esquemas Zod (HU-05)', () => {
  const validWasteInput = {
    name: 'Botellas de plastico',
    category: 'RECYCLABLE',
    description: 'Envases y botellas de plastico PET limpio.',
    colorCode: '#00FF00',
    examples: ['Botella de gaseosa', 'Envase de agua'],
    instructions: 'Enjuagar y secar antes de depositar en el contenedor.'
  };

  it('Debe validar exitosamente una entrada correcta', () => {
    const result = createWasteTypeSchema.safeParse(validWasteInput);
    expect(result.success).toBe(true);
  });

  it('Debe fallar si el nombre del residuo es demasiado corto', () => {
    const invalidInput = { ...validWasteInput, name: 'A' };
    const result = createWasteTypeSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('Debe fallar si el codigo de color no es un formato hex valido', () => {
    const invalidInput = { ...validWasteInput, colorCode: 'green' };
    const result = createWasteTypeSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('Debe fallar si la lista de ejemplos esta vacia', () => {
    const invalidInput = { ...validWasteInput, examples: [] };
    const result = createWasteTypeSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('Debe fallar si la categoria no pertenece al enum', () => {
    const invalidInput = { ...validWasteInput, category: 'OTHER_WASTE' };
    const result = createWasteTypeSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('Pruebas de Servicio CRUD de Residuos - Reglas de Negocio (HU-05 y HU-06)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe registrar un tipo de residuo exitosamente si el nombre no existe (HU-05)', async () => {
    (prisma.wasteType.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.wasteType.create as jest.Mock).mockResolvedValue({ id: 'wt-001', name: 'Botellas de plastico' });

    const input = {
      name: 'Botellas de plastico',
      category: 'RECYCLABLE' as const,
      description: 'Plastico limpio',
      colorCode: '#00FF00',
      examples: ['Botella PET'],
      instructions: 'Secar'
    };

    const result = await createWasteType(input);
    expect(result).toBeDefined();
    expect(result.name).toBe('Botellas de plastico');
    expect(prisma.wasteType.create).toHaveBeenCalledWith({ data: input });
  });

  it('Debe lanzar error 409 si el tipo de residuo ya esta registrado con ese nombre (HU-05)', async () => {
    (prisma.wasteType.findUnique as jest.Mock).mockResolvedValue({ id: 'wt-001', name: 'Botellas de plastico' });

    const input = {
      name: 'Botellas de plastico',
      category: 'RECYCLABLE' as const,
      colorCode: '#00FF00',
      examples: ['Botella PET']
    };

    await expect(createWasteType(input)).rejects.toEqual({
      status: 409,
      message: 'Ya existe un tipo de residuo con ese nombre'
    });
  });

  it('Debe obtener un tipo de residuo por ID (HU-06)', async () => {
    const mockWt = { id: 'wt-001', name: 'Vidrio', category: 'RECYCLABLE', colorCode: '#00FF00', examples: ['Botella de vidrio'], instructions: 'Sin tapas' };
    (prisma.wasteType.findUnique as jest.Mock).mockResolvedValue(mockWt);

    const result = await getWasteType('wt-001');
    expect(result).toEqual(mockWt);
  });

  it('Debe lanzar error 404 si el tipo de residuo no existe (HU-06)', async () => {
    (prisma.wasteType.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getWasteType('wt-999')).rejects.toEqual({
      status: 404,
      message: 'Tipo de residuo no encontrado'
    });
  });

  it('Debe alternar (toggle) el estado de activacion del residuo (HU-05)', async () => {
    const mockWt = { id: 'wt-001', name: 'Vidrio', isActive: true };
    (prisma.wasteType.findUnique as jest.Mock).mockResolvedValue(mockWt);
    (prisma.wasteType.update as jest.Mock).mockResolvedValue({ ...mockWt, isActive: false });

    const result = await toggleWasteTypeStatus('wt-001');
    expect(result.isActive).toBe(false);
  });
});
