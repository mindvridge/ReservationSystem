"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Menu, X, Calendar, User, Settings, Home } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "홈", icon: Home },
  { href: "/counselors", label: "상담사 찾기", icon: User },
];

const clientLinks = [
  { href: "/dashboard", label: "내 예약", icon: Calendar },
];

const counselorLinks = [
  { href: "/counselor/dashboard", label: "상담 관리", icon: Calendar },
  { href: "/counselor/schedule", label: "일정 설정", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "관리자", icon: Settings },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  const userRole = user?.publicMetadata?.role as string | undefined;

  const getNavLinks = () => {
    let links = [...publicLinks];

    if (isSignedIn) {
      links = [...links, ...clientLinks];

      if (userRole === "COUNSELOR" || userRole === "ADMIN") {
        links = [...links, ...counselorLinks];
      }

      if (userRole === "ADMIN") {
        links = [...links, ...adminLinks];
      }
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">
              심리상담 예약
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* 인증 버튼 */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">회원가입</Button>
                </SignUpButton>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center space-x-3 px-2 py-2 rounded-md transition-colors",
                      pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {!isSignedIn && (
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="w-full">
                      로그인
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="w-full">회원가입</Button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
