import "@clerk/nextjs";

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: "CLIENT" | "COUNSELOR" | "ADMIN";
    };
  }
}
