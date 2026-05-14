import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Zone from '@/lib/models/Zone';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const zone = await Zone.findById(id);
    if (!zone) return errorResponse('Zona no encontrada', 404);
    return successResponse(zone);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al obtener zona', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const zone = await Zone.findByIdAndUpdate(id, body, { new: true });
    if (!zone) return errorResponse('Zona no encontrada', 404);
    return successResponse(zone, 'Zona actualizada');
  } catch (err) {
    console.error(err);
    return errorResponse('Error al actualizar zona', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const zone = await Zone.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!zone) return errorResponse('Zona no encontrada', 404);
    return successResponse(null, 'Zona desactivada');
  } catch (err) {
    console.error(err);
    return errorResponse('Error al desactivar zona', 500);
  }
}
