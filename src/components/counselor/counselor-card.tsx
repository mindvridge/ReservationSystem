import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Clock } from "lucide-react";

interface CounselorCardProps {
  counselor: {
    id: string;
    title: string | null;
    bio: string | null;
    specialties: string[];
    sessionDuration: number;
    sessionPrice: number;
    user: {
      id: string;
      name: string | null;
      profileImage: string | null;
    };
  };
}

export function CounselorCard({ counselor }: CounselorCardProps) {
  const initials = counselor.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={counselor.user.profileImage || undefined}
              alt={counselor.user.name || "상담사"}
            />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {counselor.user.name || "이름 없음"}
            </h3>
            {counselor.title && (
              <p className="text-sm text-muted-foreground truncate">
                {counselor.title}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        {counselor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {counselor.bio}
          </p>
        )}

        {counselor.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {counselor.specialties.slice(0, 4).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {counselor.specialties.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{counselor.specialties.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {counselor.sessionDuration}분
          </span>
          <span className="font-medium text-foreground">
            {formatPrice(counselor.sessionPrice)}
          </span>
        </div>
        <Link href={`/counselors/${counselor.id}`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto" size="sm">
            예약하기
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
