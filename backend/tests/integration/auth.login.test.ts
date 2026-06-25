import { loginSchema } from '../../src/validators/auth.validator';

describe('Pruebas Unitarias de Login - Esquema de Entrada (HU-02)', () => {
  it('Debe pasar la validación con correo y contraseña correctos', () => {
    const validInput = {
      email: 'ciudadano@cusco.com',
      password: 'Password123',
    };
    const result = loginSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('Debe fallar si el correo electrónico es inválido', () => {
    const invalidEmailInput = {
      email: 'not-an-email',
      password: 'Password123',
    };
    const result = loginSchema.safeParse(invalidEmailInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.errors.find((e) => e.path.includes('email'));
      expect(emailError).toBeDefined();
      expect(emailError?.message).toBe('Correo electrónico inválido');
    }
  });

  it('Debe fallar si la contraseña está vacía', () => {
    const emptyPasswordInput = {
      email: 'ciudadano@cusco.com',
      password: '',
    };
    const result = loginSchema.safeParse(emptyPasswordInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const passError = result.error.errors.find((e) => e.path.includes('password'));
      expect(passError).toBeDefined();
      expect(passError?.message).toBe('Ingrese su contraseña');
    }
  });
});
