"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Save, X, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const SPECIALTY_OPTIONS = [
  "우울증",
  "불안장애",
  "스트레스",
  "대인관계",
  "가족상담",
  "커플상담",
  "직장문제",
  "자존감",
  "트라우마",
  "중독",
  "진로상담",
  "학업스트레스",
];

interface CounselorProfile {
  id: string;
  bio: string;
  specialties: string[];
  sessionDuration: number;
  sessionPrice: number;
  isActive: boolean;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
    profileImage: string | null;
  };
}

export default function CounselorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CounselorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 상태
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState(50);
  const [sessionPrice, setSessionPrice] = useState(100000);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // 유효성 검사 상태
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/counselor/profile");
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("상담사 프로필이 없습니다. 관리자에게 문의하세요.");
        }
        throw new Error("프로필을 불러오는데 실패했습니다.");
      }

      const data = await res.json();
      setProfile(data);
      setBio(data.bio || "");
      setSpecialties(data.specialties || []);
      setSessionDuration(data.sessionDuration || 50);
      setSessionPrice(data.sessionPrice || 100000);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    if (!bio.trim()) {
      newErrors.bio = "자기소개를 입력해주세요.";
    } else if (bio.length < 20) {
      newErrors.bio = "자기소개는 최소 20자 이상 입력해주세요.";
    }

    if (specialties.length === 0) {
      newErrors.specialties = "최소 1개 이상의 전문분야를 선택해주세요.";
    }

    if (sessionDuration < 30 || sessionDuration > 120) {
      newErrors.sessionDuration = "상담 시간은 30분에서 120분 사이여야 합니다.";
    }

    if (sessionPrice < 10000 || sessionPrice > 500000) {
      newErrors.sessionPrice = "상담 비용은 10,000원에서 500,000원 사이여야 합니다.";
    }

    if (phone && !/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phone.replace(/-/g, ""))) {
      newErrors.phone = "올바른 휴대폰 번호 형식이 아닙니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await fetch("/api/counselor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          specialties,
          sessionDuration,
          sessionPrice,
          name,
          phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "프로필 저장에 실패했습니다.");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function toggleSpecialty(specialty: string) {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter((s) => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
    if (errors.specialties) {
      setErrors({ ...errors, specialties: "" });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium">오류가 발생했습니다</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={loadProfile} className="ml-auto">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">프로필 수정</h1>
        <p className="text-muted-foreground">상담사 프로필 정보를 수정합니다.</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          프로필이 성공적으로 저장되었습니다.
        </div>
      )}

      {error && profile && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>프로필에 표시될 기본 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="홍길동"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* 연락처 */}
            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                placeholder="010-1234-5678"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* 자기소개 */}
            <div className="space-y-2">
              <Label htmlFor="bio">자기소개 *</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (errors.bio) setErrors({ ...errors, bio: "" });
                }}
                placeholder="상담 경력, 전문 분야, 상담 철학 등을 소개해주세요."
                rows={5}
                className={errors.bio ? "border-red-500" : ""}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{errors.bio && <span className="text-red-500">{errors.bio}</span>}</span>
                <span>{bio.length}자</span>
              </div>
            </div>

            {/* 전문분야 */}
            <div className="space-y-2">
              <Label>전문분야 *</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant={specialties.includes(specialty) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => toggleSpecialty(specialty)}
                  >
                    {specialties.includes(specialty) ? (
                      <X className="h-3 w-3 mr-1" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    {specialty}
                  </Badge>
                ))}
              </div>
              {errors.specialties && (
                <p className="text-sm text-red-500">{errors.specialties}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>상담 설정</CardTitle>
            <CardDescription>상담 시간과 비용을 설정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 상담 시간 */}
            <div className="space-y-2">
              <Label htmlFor="sessionDuration">상담 시간 (분) *</Label>
              <Input
                id="sessionDuration"
                type="number"
                value={sessionDuration}
                onChange={(e) => {
                  setSessionDuration(parseInt(e.target.value) || 0);
                  if (errors.sessionDuration) setErrors({ ...errors, sessionDuration: "" });
                }}
                min={30}
                max={120}
                step={10}
                className={errors.sessionDuration ? "border-red-500" : ""}
              />
              {errors.sessionDuration && (
                <p className="text-sm text-red-500">{errors.sessionDuration}</p>
              )}
              <p className="text-sm text-muted-foreground">30분 ~ 120분 사이로 설정해주세요.</p>
            </div>

            {/* 상담 비용 */}
            <div className="space-y-2">
              <Label htmlFor="sessionPrice">상담 비용 (원) *</Label>
              <Input
                id="sessionPrice"
                type="number"
                value={sessionPrice}
                onChange={(e) => {
                  setSessionPrice(parseInt(e.target.value) || 0);
                  if (errors.sessionPrice) setErrors({ ...errors, sessionPrice: "" });
                }}
                min={10000}
                max={500000}
                step={10000}
                className={errors.sessionPrice ? "border-red-500" : ""}
              />
              {errors.sessionPrice && (
                <p className="text-sm text-red-500">{errors.sessionPrice}</p>
              )}
              <p className="text-sm text-muted-foreground">
                현재 설정: {formatPrice(sessionPrice)} / {sessionDuration}분
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-4">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              "저장 중..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                프로필 저장
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
