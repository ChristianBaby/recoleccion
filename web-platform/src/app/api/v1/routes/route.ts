import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Route from '@/lib/models/Route';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zone');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (zoneId) filter.zone = zoneId;
    if (status) filter.status = status;

    const routes = await Route.find(filter)
      .populate('zone', 'name district color')
      .populate('vehicle', 'plate type')
      .populate('operator', 'firstName lastName email')
      .populate('wasteTypes', 'name category colorCode')
      .sort({ name: 1 });

    return successResponse(routes);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al obtener rutas', 500);
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { name, zone, vehicle, operator, wasteTypes, schedule, waypoints, path, status } = body;

    if (!name || !zone || !vehicle || !operator || !schedule) {
      return errorResponse('Nombre, zona, vehículo, operador y horario son obligatorios', 400);
    }

    const route = await Route.create({
      name, zone, vehicle, operator,
      wasteTypes: wasteTypes || [],
      schedule,
      waypoints: waypoints || [],
      path: path || { type: 'LineString', coordinates: [] },
      status: status || 'draft',
      createdBy: user!.sub,
    });

    const populated = await Route.findById(route._id)
      .populate('zone', 'name district color')
      .populate('vehicle', 'plate type')
      .populate('operator', 'firstName lastName email')
      .populate('wasteTypes', 'name category colorCode');

    return successResponse(populated, 'Ruta creada exitosamente', 201);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al crear ruta', 500);
  }
}
