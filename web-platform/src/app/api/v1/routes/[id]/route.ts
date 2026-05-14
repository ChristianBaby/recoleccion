import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Route from '@/lib/models/Route';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin', 'operator');
  if (error) return error;
  try {
    await connectDB();
    const { id } = await params;
    const route = await Route.findById(id)
      .populate('zone', 'name district color geometry')
      .populate('vehicle', 'plate type capacity')
      .populate('operator', 'firstName lastName email')
      .populate('wasteTypes', 'name category colorCode');
    if (!route) return errorResponse('Ruta no encontrada', 404);
    return successResponse(route);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al obtener ruta', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const route = await Route.findByIdAndUpdate(id, body, { new: true })
      .populate('zone', 'name district color')
      .populate('vehicle', 'plate type')
      .populate('operator', 'firstName lastName email')
      .populate('wasteTypes', 'name category colorCode');
    if (!route) return errorResponse('Ruta no encontrada', 404);
    return successResponse(route, 'Ruta actualizada');
  } catch (err) {
    console.error(err);
    return errorResponse('Error al actualizar ruta', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;
  try {
    await connectDB();
    const { id } = await params;
    const route = await Route.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
    if (!route) return errorResponse('Ruta no encontrada', 404);
    return successResponse(null, 'Ruta desactivada');
  } catch (err) {
    console.error(err);
    return errorResponse('Error al desactivar ruta', 500);
  }
}
