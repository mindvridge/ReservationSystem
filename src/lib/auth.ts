import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  profileImage: string | null;
};

// 현재 인증된 사용자 정보 가져오기
export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
}

// 현재 사용자가 특정 역할인지 확인
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === role;
}

// 사용자 동기화 (Clerk에서 DB로)
export async function syncUserFromClerk() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("User email not found");
  }

  // 역할은 Clerk metadata에서 가져옴
  const role = (clerkUser.publicMetadata?.role as UserRole) || UserRole.CLIENT;

  const user = await prisma.user.upsert({
    where: { id: clerkUser.id },
    update: {
      email,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
      profileImage: clerkUser.imageUrl,
      role,
    },
    create: {
      id: clerkUser.id,
      email,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
      profileImage: clerkUser.imageUrl,
      role,
    },
  });

  return user;
}

// 상담사 프로필 가져오기
export async function getCounselorProfile(userId: string) {
  const counselor = await prisma.counselor.findUnique({
    where: { userId },
    include: {
      user: true,
      schedules: true,
      scheduleExceptions: true,
    },
  });

  return counselor;
}
