import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Content-Language', 'en');
  response.headers.set('X-Content-Language', 'en');
  return response;
}

export const config = {
  matcher: '/(.*)',
};
