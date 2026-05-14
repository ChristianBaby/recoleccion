import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Vehicle from '@/lib/models/Vehicle';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const vehicles = await Vehicle.find({ isActive: true }).sort({ plate: 1 });
    return successResponse(vehicles);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al obtener vehículos', 500);
  }
}

export async function POST(request: NextRequest) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { plate, type, capacity, brand, model, year } = body;

    if (!plate || !type || !capacity || !brand || !model || !year) {
      return errorResponse('Todos los campos son obligatorios', 400);
    }

    const existing = await Vehicle.findOne({ plate: plate.toUpperCase() });
    if (existing) return errorResponse('Ya existe un vehículo con esa placa', 409);

    const vehicle = await Vehicle.create({ plate, type, capacity, brand, model, year });
    return successResponse(vehicle, 'Vehículo registrado', 201);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al crear vehículo', 500);
  }
}
