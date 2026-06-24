import { loginUser } from '../../src/services/auth.service';
import { prisma } from '../../src/config/prisma';
import bcrypt from 'bcryptjs';

// Mock de Prisma Client
jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockResolvedValue([null, null]),
  },
}));

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password-xyz'),
}));

// Mock de JWT utils
jest.mock('../../src/utils/jwt', () => ({
  signAccessToken: jest.fn().mockReturnValue('mocked-access-token-12345'),
  signRefreshToken: jest.fn().mockReturnValue('mocked-refresh-token-12345'),
}));

describe('Pruebas de Integración y Reglas de Negocio - Autenticación y Bloqueo (HU-02)', () => {
  const mockUser = {
    id: 'user-123',
    email: 'ciudadano@cusco.com',
    password: 'hashed-password-xyz',
    role: 'CITIZEN',
    firstName: 'Juan',
    lastName: 'Quispe',
    zoneId: 'zone-01',
    isActive: true,
    isVerified: true,
    lockedUntil: null as Date | null,
    failedLoginAttempts: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe fallar con error 401 y mensaje generico si el usuario no existe en la base de datos (evita enumeracion)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(loginUser({ email: 'no_existe@email.com', password: 'password123' }))
      .rejects.toEqual({ status: 401, message: 'Credenciales incorrectas' });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'no_existe@email.com' },
      select: expect.any(Object),
    });
  });

  it('Debe fallar con error 423 si la cuenta esta bloqueada temporalmente', async () => {
    const lockedTime = new Date(Date.now() + 10 * 60000); // Bloqueado por 10 minutos
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      lockedUntil: lockedTime,
    });

    await expect(loginUser({ email: 'ciudadano@cusco.com', password: 'Password123' }))
      .rejects.toEqual(expect.objectContaining({
        status: 423,
        message: expect.stringContaining('Cuenta bloqueada temporalmente'),
      }));

    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('Debe incrementar failedLoginAttempts y advertir de intentos restantes si la contrasena es incorrecta', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await expect(loginUser({ email: 'ciudadano@cusco.com', password: 'WrongPassword' }))
      .rejects.toEqual({
        status: 401,
        message: 'Credenciales incorrectas. Te quedan 4 intento(s) antes del bloqueo.',
      });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: {
        failedLoginAttempts: 1,
        lockedUntil: null,
      },
    });
  });

  it('Debe bloquear temporalmente la cuenta por 15 minutos en el 5o intento fallido', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      failedLoginAttempts: 4, // Ya tenia 4 intentos fallidos previos
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await expect(loginUser({ email: 'ciudadano@cusco.com', password: 'WrongPassword' }))
      .rejects.toEqual({
        status: 423,
        message: 'Cuenta bloqueada por 15 minutos por múltiples intentos fallidos.',
      });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: {
        failedLoginAttempts: 5,
        lockedUntil: expect.any(Date),
      },
    });
  });

  it('Debe iniciar sesion exitosamente, resetear intentos y retornar tokens si las credenciales son correctas', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      failedLoginAttempts: 2, // Tenia intentos acumulados
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const response = await loginUser({ email: 'ciudadano@cusco.com', password: 'Password123' });

    expect(response).toEqual(expect.objectContaining({
      accessToken: 'mocked-access-token-12345',
      refreshToken: 'mocked-refresh-token-12345',
      user: expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      }),
    }));

    // Validamos que se limpien los intentos fallidos en la base de datos
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
