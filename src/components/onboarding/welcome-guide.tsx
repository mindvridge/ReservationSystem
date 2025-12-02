"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Search, Bell, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GUIDE_STEPS = [
  {
    icon: Search,
    title: "상담사 찾기",
    description: "전문 분야와 일정에 맞는 상담사를 찾아보세요.",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    icon: Calendar,
    title: "예약하기",
    description: "원하는 날짜와 시간에 간편하게 예약하세요.",
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  {
    icon: Bell,
    title: "알림 받기",
    description: "예약 확인과 리마인더를 이메일로 받으세요.",
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  {
    icon: Heart,
    title: "상담 시작",
    description: "전문 상담사와 함께 마음의 건강을 챙기세요.",
    color: "text-pink-500",
    bgColor: "bg-pink-100",
  },
];

interface WelcomeGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeGuide({ isOpen, onClose }: WelcomeGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // 로컬 스토리지에 가이드 완료 저장
    localStorage.setItem("welcomeGuideCompleted", "true");
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem("welcomeGuideCompleted", "true");
    onClose();
  };

  const step = GUIDE_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={cn("mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4", step.bgColor)}>
            <Icon className={cn("h-8 w-8", step.color)} />
          </div>
          <DialogTitle className="text-center text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-center">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* 진행 표시 */}
        <div className="flex justify-center gap-2 py-4">
          {GUIDE_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            건너뛰기
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentStep < GUIDE_STEPS.length - 1 ? (
              <>
                다음
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "시작하기"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 웰컴 가이드 훅
export function useWelcomeGuide() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    const completed = localStorage.getItem("welcomeGuideCompleted");
    if (!completed) {
      // 약간의 딜레이 후 가이드 표시
      const timer = setTimeout(() => {
        setShowGuide(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeGuide = () => {
    setShowGuide(false);
  };

  return { showGuide, closeGuide };
}
