import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-xl font-medium mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              홈으로 이동
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/counselors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              상담사 찾기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
