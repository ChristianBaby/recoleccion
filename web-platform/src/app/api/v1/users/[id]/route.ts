import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/models/User';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).populate('zone', 'name district');
    if (!user) return errorResponse('Usuario no encontrado', 404);
    return successResponse(user);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al obtener usuario', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    delete body.password;
    delete body.email;

    const user = await User.findByIdAndUpdate(id, body, { new: true }).populate('zone', 'name district');
    if (!user) return errorResponse('Usuario no encontrado', 404);
    return successResponse(user, 'Usuario actualizado');
  } catch (err) {
    console.error(err);
    return errorResponse('Error al actualizar usuario', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) return errorResponse('Usuario no encontrado', 404);
    return successResponse(null, 'Usuario desactivado');
  } catch (err) {
    console.error(err);
    return errorResponse('Error al desactivar usuario', 500);
  }
}
