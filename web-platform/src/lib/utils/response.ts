import { NextResponse } from 'next/server';

export function successResponse(data: unknown, message = 'OK', status = 200) {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: { code: code || 'ERROR', message } },
    { status }
  );
}
