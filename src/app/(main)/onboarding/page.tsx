"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  User,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Heart,
  Shield,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "환영합니다", icon: Sparkles },
  { id: 2, title: "프로필 설정", icon: User },
  { id: 3, title: "완료", icon: CheckCircle },
];

const INTERESTS = [
  "스트레스 관리",
  "우울감",
  "불안",
  "대인관계",
  "가족 문제",
  "직장 스트레스",
  "자존감",
  "진로/학업",
  "연애/결혼",
  "트라우마",
  "중독",
  "기타",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 프로필 상태
  const [name, setName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // 프로필 저장
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          interests,
          bio,
          onboardingCompleted: true,
        }),
      });

      if (!res.ok) {
        throw new Error("프로필 저장에 실패했습니다.");
      }

      // 대시보드로 이동
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const skipOnboarding = () => {
    router.push("/counselors");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 진행 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-1 mx-2 rounded",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {currentStep} / {STEPS.length} 단계
          </p>
        </div>

        {/* 스텝 1: 환영 */}
        {currentStep === 1 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">심리상담 예약 시스템에 오신 것을 환영합니다</CardTitle>
              <CardDescription>
                마음의 건강을 위한 첫 걸음을 함께 시작해보세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                  <h3 className="font-medium mb-1">전문 상담사</h3>
                  <p className="text-sm text-muted-foreground">
                    검증된 전문 상담사와 상담
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h3 className="font-medium mb-1">안전한 환경</h3>
                  <p className="text-sm text-muted-foreground">
                    철저한 비밀 보장
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-medium mb-1">편리한 예약</h3>
                  <p className="text-sm text-muted-foreground">
                    원하는 시간에 간편하게
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={handleNext} className="flex-1">
                  시작하기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={skipOnboarding}>
                  건너뛰기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 스텝 2: 프로필 설정 */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>프로필을 설정해주세요</CardTitle>
              <CardDescription>
                더 나은 상담 매칭을 위해 정보를 입력해주세요. (선택사항)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">연락처 (선택)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label>관심 분야 (선택)</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <Badge
                        key={interest}
                        variant={interests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">간단한 자기소개 (선택)</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="상담을 통해 어떤 도움을 받고 싶으신가요?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  다음
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 스텝 3: 완료 */}
        {currentStep === 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">준비가 완료되었습니다!</CardTitle>
              <CardDescription>
                이제 상담사를 찾아 예약을 시작해보세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium">다음 단계</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    상담사 목록에서 마음에 드는 상담사를 찾아보세요
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    원하는 날짜와 시간에 예약하세요
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    상담을 통해 마음의 안정을 찾으세요
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
                <Button onClick={handleComplete} disabled={isLoading} className="flex-1">
                  {isLoading ? "저장 중..." : "상담사 찾아보기"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
