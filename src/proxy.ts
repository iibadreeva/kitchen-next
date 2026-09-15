import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import {
  ROUTE_ERROR_AUTH_MISCONFIGURED,
  ROUTE_ERROR_UNAUTHORIZED,
} from "@/utils/route-error";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET;
  // getToken не читает AUTH_SECRET из env сам — без secret будет MissingSecret.
  const token = secret ? await getToken({ req, secret }) : null;
  const protectedRoutes = ["/ingredients"];
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      const url = new URL("/error", req.url);
      url.searchParams.set(
        "code",
        secret ? ROUTE_ERROR_UNAUTHORIZED : ROUTE_ERROR_AUTH_MISCONFIGURED,
      );
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ingredients"],
};
