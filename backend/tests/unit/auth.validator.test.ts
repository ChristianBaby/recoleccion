import { registerSchema } from '../../src/validators/auth.validator';

describe('Pruebas Unitarias de Registro - Consentimiento y Validación (HU-01)', () => {
  const baseValidInput = {
    firstName: 'Juan',
    lastName: 'Quispe',
    dni: '12345678',
    email: 'juan.quispe@cusco.com',
    password: 'Password123',
    address: 'Av. El Sol 123',
    district: 'Cusco',
    phone: '51987654321', // Teléfono válido según regex del backend (con prefijo 51)
    consent: true, // Consentimiento de Ley 29733 aceptado
  };

  it('Debe validar exitosamente con datos de entrada correctos y consentimiento aceptado', () => {
    const result = registerSchema.safeParse(baseValidInput);
    expect(result.success).toBe(true);
  });

  it('Debe fallar si el consentimiento (consent) de la Ley N.º 29733 es false', () => {
    const invalidInput = { ...baseValidInput, consent: false };
    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const consentError = result.error.errors.find((e) => e.path.includes('consent'));
      expect(consentError).toBeDefined();
      expect(consentError?.message).toBe('Debes aceptar los términos y condiciones de privacidad');
    }
  });

  it('Debe fallar si el DNI no tiene exactamente 8 dígitos', () => {
    const invalidDni = { ...baseValidInput, dni: '1234567' }; // 7 dígitos
    const result = registerSchema.safeParse(invalidDni);
    expect(result.success).toBe(false);
    if (!result.success) {
      const dniError = result.error.errors.find((e) => e.path.includes('dni'));
      expect(dniError).toBeDefined();
      expect(dniError?.message).toBe('El DNI debe tener exactamente 8 dígitos');
    }
  });

  it('Debe fallar si el DNI contiene letras', () => {
    const invalidDni = { ...baseValidInput, dni: '1234567A' };
    const result = registerSchema.safeParse(invalidDni);
    expect(result.success).toBe(false);
    if (!result.success) {
      const dniError = result.error.errors.find((e) => e.path.includes('dni'));
      expect(dniError).toBeDefined();
      expect(dniError?.message).toBe('El DNI solo debe contener dígitos');
    }
  });

  it('Debe fallar si la contraseña no cumple las reglas de robustez (sin mayúscula)', () => {
    const invalidPass = { ...baseValidInput, password: 'password123' };
    const result = registerSchema.safeParse(invalidPass);
    expect(result.success).toBe(false);
    if (!result.success) {
      const passError = result.error.errors.find((e) => e.path.includes('password'));
      expect(passError).toBeDefined();
      expect(passError?.message).toBe('Debe contener al menos una letra mayúscula');
    }
  });
});
