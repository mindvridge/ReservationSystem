"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold mb-2">문제가 발생했습니다</h1>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-lg mx-auto">
            <p className="text-sm font-mono text-red-700 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              홈으로 이동
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
