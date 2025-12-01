"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

const SPECIALTIES = [
  "우울",
  "불안",
  "스트레스",
  "대인관계",
  "자존감",
  "진로/취업",
  "가족",
  "부부/커플",
  "트라우마",
  "중독",
  "성격",
  "정서조절",
];

export function CounselorFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const selectedSpecialty = searchParams.get("specialty");

  const updateFilters = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/counselors?${newParams.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: search || null });
  };

  const handleSpecialtyClick = (specialty: string) => {
    if (selectedSpecialty === specialty) {
      updateFilters({ specialty: null });
    } else {
      updateFilters({ specialty });
    }
  };

  const clearFilters = () => {
    setSearch("");
    updateFilters({ search: null, specialty: null });
  };

  const hasFilters = search || selectedSpecialty;

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="상담사 이름, 전문 분야로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          검색
        </Button>
      </form>

      {/* 전문 분야 필터 */}
      <div className="flex flex-wrap gap-2">
        {SPECIALTIES.map((specialty) => (
          <Badge
            key={specialty}
            variant={selectedSpecialty === specialty ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => handleSpecialtyClick(specialty)}
          >
            {specialty}
          </Badge>
        ))}
      </div>

      {/* 필터 초기화 */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">활성 필터:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              검색: {search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearch("");
                  updateFilters({ search: null });
                }}
              />
            </Badge>
          )}
          {selectedSpecialty && (
            <Badge variant="secondary" className="gap-1">
              {selectedSpecialty}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilters({ specialty: null })}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-destructive hover:text-destructive"
          >
            모두 초기화
          </Button>
        </div>
      )}
    </div>
  );
}
