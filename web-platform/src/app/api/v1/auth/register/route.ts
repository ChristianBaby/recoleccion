import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/models/User';
import { signAccessToken, signRefreshToken } from '@/lib/utils/jwt';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password, dni, firstName, lastName, phone, address, district } = body;

    if (!email || !password || !dni || !firstName || !lastName || !address) {
      return errorResponse('Todos los campos obligatorios deben ser completados', 400);
    }

    if (!/^\d{8}$/.test(dni)) {
      return errorResponse('El DNI debe tener exactamente 8 dígitos', 400);
    }

    if (password.length < 6) {
      return errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
    }

    const existingUser = await User.findOne({ $or: [{ email }, { dni }] });
    if (existingUser) {
      return errorResponse(
        existingUser.email === email ? 'El correo ya está registrado' : 'El DNI ya está registrado',
        409,
        'DUPLICATE'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password: hashedPassword,
      dni,
      firstName,
      lastName,
      phone,
      address,
      role: 'citizen',
    });

    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return successResponse(
      {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          dni: user.dni,
        },
      },
      'Registro exitoso',
      201
    );
  } catch (error: unknown) {
    console.error('Register error:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}
