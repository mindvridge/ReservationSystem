import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Shield, Users, Heart, MessageCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 히어로 섹션 */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              마음의 건강을 위한
              <br />
              <span className="text-primary">전문 심리상담</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              검증된 전문 상담사와 함께 마음의 안정을 찾아보세요.
              온라인으로 쉽고 편리하게 예약하고, 상담 받으실 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/counselors">
                <Button size="lg" className="w-full sm:w-auto">
                  상담사 찾기
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  서비스 알아보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">왜 저희 서비스인가요?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              안전하고 편리한 심리상담 예약 시스템으로 마음 건강을 챙기세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>검증된 전문가</CardTitle>
                <CardDescription>
                  모든 상담사는 자격증과 경력을 철저히 검증받았습니다.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>편리한 예약</CardTitle>
                <CardDescription>
                  원하는 시간에 쉽고 빠르게 예약할 수 있습니다.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>자동 알림</CardTitle>
                <CardDescription>
                  예약 확정과 리마인더를 SMS/이메일로 받아보세요.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>다양한 전문 분야</CardTitle>
                <CardDescription>
                  우울, 불안, 관계, 진로 등 다양한 분야의 전문가를 만나보세요.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-10 w-10 text-primary mb-2" />
                <CardTitle>맞춤형 상담</CardTitle>
                <CardDescription>
                  나에게 맞는 상담사를 찾아 편안하게 상담받으세요.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>안전한 환경</CardTitle>
                <CardDescription>
                  개인정보 보호와 비밀 보장을 최우선으로 합니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* 이용 방법 섹션 */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">이용 방법</h2>
            <p className="text-muted-foreground">
              간단한 3단계로 상담을 시작하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">상담사 선택</h3>
              <p className="text-sm text-muted-foreground">
                프로필과 전문 분야를 확인하고 원하는 상담사를 선택하세요.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">일정 예약</h3>
              <p className="text-sm text-muted-foreground">
                상담사의 가용 시간을 확인하고 편한 시간에 예약하세요.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">상담 시작</h3>
              <p className="text-sm text-muted-foreground">
                예약 확정 후 상담 일정에 맞춰 상담을 시작하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto text-center p-8">
            <CardHeader>
              <CardTitle className="text-2xl">지금 바로 시작하세요</CardTitle>
              <CardDescription className="text-base">
                마음의 건강은 미루지 마세요.
                전문 상담사와 함께 더 나은 내일을 만들어가세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/counselors">
                <Button size="lg">무료로 상담사 찾기</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
