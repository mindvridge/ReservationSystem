import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 공개 라우트 정의
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/counselors(.*)",
  "/api/webhooks(.*)",
]);

// 상담사 전용 라우트
const isCounselorRoute = createRouteMatcher([
  "/counselor(.*)",
]);

// 관리자 전용 라우트
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 공개 라우트는 인증 불필요
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 비공개 라우트는 인증 필요
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 역할 기반 접근 제어
  const metadata = sessionClaims?.metadata as { role?: string } | undefined;
  const userRole = metadata?.role;

  // 상담사 라우트 접근 제어
  if (isCounselorRoute(req)) {
    if (userRole !== "COUNSELOR" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 관리자 라우트 접근 제어
  if (isAdminRoute(req)) {
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
