import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import WasteType from '@/lib/models/WasteType';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { examples: { $regex: search, $options: 'i' } },
      ];
    }

    const wasteTypes = await WasteType.find(filter).sort({ category: 1, name: 1 });
    return successResponse(wasteTypes);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al obtener tipos de residuos', 500);
  }
}

export async function POST(request: NextRequest) {
  const { error } = requireRole(request, 'admin');
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { name, category, description, examples, handlingInstructions, colorCode } = body;

    if (!name || !category || !description || !handlingInstructions || !colorCode) {
      return errorResponse('Todos los campos son obligatorios', 400);
    }

    const existing = await WasteType.findOne({ name });
    if (existing) {
      return errorResponse('Ya existe un tipo de residuo con ese nombre', 409);
    }

    const wasteType = await WasteType.create({
      name, category, description, examples: examples || [], handlingInstructions, colorCode,
    });

    return successResponse(wasteType, 'Tipo de residuo creado', 201);
  } catch (err) {
    console.error(err);
    return errorResponse('Error al crear tipo de residuo', 500);
  }
}
