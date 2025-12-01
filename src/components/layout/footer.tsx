import Link from "next/link";
import { Calendar } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 브랜드 */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-bold">심리상담 예약</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              전문 심리상담사와의 상담을 쉽고 편리하게 예약하세요.
            </p>
          </div>

          {/* 서비스 */}
          <div className="space-y-4">
            <h3 className="font-semibold">서비스</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/counselors" className="hover:text-primary">
                  상담사 찾기
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary">
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary">
                  자주 묻는 질문
                </Link>
              </li>
            </ul>
          </div>

          {/* 상담사 */}
          <div className="space-y-4">
            <h3 className="font-semibold">상담사</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/counselor/register" className="hover:text-primary">
                  상담사 등록
                </Link>
              </li>
              <li>
                <Link href="/counselor/guide" className="hover:text-primary">
                  이용 가이드
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div className="space-y-4">
            <h3 className="font-semibold">고객지원</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-primary">
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 심리상담 예약 시스템. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
