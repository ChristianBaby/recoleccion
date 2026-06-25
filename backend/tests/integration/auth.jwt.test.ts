import { signAccessToken, verifyAccessToken } from '../../src/utils/jwt';
import jwt from 'jsonwebtoken';

// Mock de la configuración env para evitar problemas si las variables no están cargadas
jest.mock('../../src/config/env', () => ({
  env: {
    jwt: {
      accessSecret: 'test-access-secret-key-12345',
      accessExpiresIn: '15m',
      refreshSecret: 'test-refresh-secret-key-12345',
      refreshExpiresIn: '7d',
    },
  },
}));

describe('Pruebas Unitarias de Autenticación - Firma y Verificación de JWT (HU-02)', () => {
  const testPayloads = [
    { sub: 'user-id-ciudadano-001', email: 'citizen@cusco.com', role: 'CITIZEN' },
    { sub: 'user-id-operador-002', email: 'operator@cusco.com', role: 'OPERATOR' },
    { sub: 'user-id-admin-003', email: 'admin@cusco.com', role: 'ADMIN' },
  ];

  it.each(testPayloads)(
    'Debe firmar y verificar correctamente el Access Token para el rol: $role',
    (payload) => {
      const token = signAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verificamos y decodificamos el token
      const decoded = verifyAccessToken(token);
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    }
  );

  it('Debe fallar la verificación si el token de acceso es inválido', () => {
    const invalidToken = 'this-is-not-a-valid-token-string';
    expect(() => verifyAccessToken(invalidToken)).toThrow();
  });

  it('Debe fallar si el token fue firmado con una clave secreta diferente', () => {
    const payload = { sub: 'user-id-001', email: 'test@test.com', role: 'CITIZEN' };
    const foreignToken = jwt.sign(payload, 'wrong-secret-key-9999', { expiresIn: '15m' });
    
    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });
});
