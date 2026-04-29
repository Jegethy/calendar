/**
 * API Response Utilities - Standardized response handling across all endpoints
 * Ensures consistent response structure and status codes
 */

import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

/**
 * Success response - 200 OK (or custom status)
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Created response - 201 Created
 */
export function createdResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

/**
 * No content response - 204 No Content (usually for DELETE)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Error response - Generic error with custom status
 */
export function errorResponse(error: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Validation error - 400 Bad Request
 */
export function validationError(error: string): NextResponse<ApiResponse> {
  return errorResponse(error, 400);
}

/**
 * Unauthorized error - 401 Unauthorized
 */
export function unauthorizedError(error = 'Unauthorized'): NextResponse<ApiResponse> {
  return errorResponse(error, 401);
}

/**
 * Forbidden error - 403 Forbidden
 */
export function forbiddenError(error = 'Forbidden'): NextResponse<ApiResponse> {
  return errorResponse(error, 403);
}

/**
 * Not found error - 404 Not Found
 */
export function notFoundError(error = 'Not found'): NextResponse<ApiResponse> {
  return errorResponse(error, 404);
}

/**
 * Conflict error - 409 Conflict
 */
export function conflictError(error: string): NextResponse<ApiResponse> {
  return errorResponse(error, 409);
}

/**
 * Internal server error - 500 Internal Server Error
 */
export function internalServerError(error = 'Internal server error'): NextResponse<ApiResponse> {
  console.error('[API Error]', error);
  return errorResponse(error, 500);
}

/**
 * Safely handle async route handlers with automatic error catching
 */
export async function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  try {
    return await handler();
  } catch (error) {
    console.error('[Unhandled API Error]', error);
    return internalServerError() as NextResponse<T>;
  }
}
