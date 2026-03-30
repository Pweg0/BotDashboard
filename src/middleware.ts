import { auth } from './lib/auth';
import { NextResponse } from 'next/server';

// Middleware handles basic session check for /dashboard/* routes.
// Role verification (adminRoleId) is performed in the dashboard layout server component
// to avoid Edge runtime compatibility issues with Mongoose.
export default auth((req) => {
  const session = req.auth;

  // Not logged in -> redirect to login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
