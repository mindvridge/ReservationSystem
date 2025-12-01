import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CounselorCard } from "@/components/counselor/counselor-card";
import { CounselorFilters } from "@/components/counselor/counselor-filters";
import { Skeleton } from "@/components/ui/skeleton";

interface CounselorsPageProps {
  searchParams: {
    specialty?: string;
    search?: string;
  };
}

async function getCounselors(specialty?: string, search?: string) {
  const counselors = await prisma.counselor.findMany({
    where: {
      isActive: true,
      ...(specialty && {
        specialties: {
          has: specialty,
        },
      }),
      ...(search && {
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            bio: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return counselors;
}

function CounselorListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function CounselorList({
  specialty,
  search,
}: {
  specialty?: string;
  search?: string;
}) {
  const counselors = await getCounselors(specialty, search);

  if (counselors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {search || specialty
            ? "검색 조건에 맞는 상담사가 없습니다."
            : "등록된 상담사가 없습니다."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {counselors.map((counselor) => (
        <CounselorCard key={counselor.id} counselor={counselor} />
      ))}
    </div>
  );
}

export default function CounselorsPage({ searchParams }: CounselorsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">상담사 찾기</h1>
        <p className="text-muted-foreground">
          전문 분야와 경력을 확인하고 나에게 맞는 상담사를 선택하세요.
        </p>
      </div>

      <CounselorFilters />

      <div className="mt-8">
        <Suspense fallback={<CounselorListSkeleton />}>
          <CounselorList
            specialty={searchParams.specialty}
            search={searchParams.search}
          />
        </Suspense>
      </div>
    </div>
  );
}
