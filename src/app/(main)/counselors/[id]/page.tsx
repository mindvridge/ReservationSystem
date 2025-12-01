import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { formatPrice } from "@/lib/utils";
import { Clock, GraduationCap, Award, Briefcase } from "lucide-react";

interface CounselorPageProps {
  params: {
    id: string;
  };
}

async function getCounselor(id: string) {
  const counselor = await prisma.counselor.findUnique({
    where: { id, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      schedules: {
        where: { isActive: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  return counselor;
}

export default async function CounselorPage({ params }: CounselorPageProps) {
  const counselor = await getCounselor(params.id);

  if (!counselor) {
    notFound();
  }

  const initials = counselor.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 상담사 정보 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage
                  src={counselor.user.profileImage || undefined}
                  alt={counselor.user.name || "상담사"}
                />
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">
                {counselor.user.name || "이름 없음"}
              </CardTitle>
              {counselor.title && (
                <p className="text-muted-foreground">{counselor.title}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  상담 시간
                </span>
                <span className="font-medium">{counselor.sessionDuration}분</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">상담 비용</span>
                <span className="font-semibold text-lg text-primary">
                  {formatPrice(counselor.sessionPrice)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 전문 분야 */}
          {counselor.specialties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  전문 분야
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {counselor.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 학력 */}
          {counselor.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  학력
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {counselor.education.map((edu, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {edu}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 자격증 */}
          {counselor.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  자격증
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {counselor.certifications.map((cert, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {cert}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 예약 및 소개 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 자기소개 */}
          {counselor.bio && (
            <Card>
              <CardHeader>
                <CardTitle>상담사 소개</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {counselor.bio}
                </p>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* 예약 캘린더 */}
          <Card>
            <CardHeader>
              <CardTitle>예약하기</CardTitle>
              <p className="text-sm text-muted-foreground">
                원하시는 날짜와 시간을 선택해주세요.
              </p>
            </CardHeader>
            <CardContent>
              <BookingCalendar
                counselorId={counselor.id}
                counselorName={counselor.user.name || "상담사"}
                sessionDuration={counselor.sessionDuration}
                sessionPrice={counselor.sessionPrice}
                schedules={counselor.schedules}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
