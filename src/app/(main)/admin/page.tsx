"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Calendar,
  UserCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDateKST, formatTimeKST } from "@/lib/datetime";
import { formatPrice } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  totalCounselors: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface Counselor {
  id: string;
  user: {
    name: string | null;
    email: string;
  };
  specialties: string[];
  isActive: boolean;
  sessionPrice: number;
  _count: {
    appointments: number;
  };
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  counselor: {
    user: {
      name: string | null;
    };
  };
  client: {
    name: string | null;
    email: string;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, usersRes, counselorsRes, appointmentsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/counselors"),
        fetch("/api/admin/appointments?limit=10"),
      ]);

      if (!statsRes.ok || !usersRes.ok || !counselorsRes.ok || !appointmentsRes.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다.");
      }

      const [statsData, usersData, counselorsData, appointmentsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        counselorsRes.json(),
        appointmentsRes.json(),
      ]);

      setStats(statsData);
      setUsers(usersData.users || []);
      setCounselors(counselorsData.counselors || []);
      setAppointments(appointmentsData.appointments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, role: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) throw new Error("역할 변경에 실패했습니다.");

      await loadDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }

  async function toggleCounselorStatus(counselorId: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/counselors/${counselorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) throw new Error("상태 변경에 실패했습니다.");

      await loadDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-blue-500">확정</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500">완료</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">취소</Badge>;
      case "NO_SHOW":
        return <Badge variant="secondary">노쇼</Badge>;
      default:
        return <Badge variant="outline">대기</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-purple-500">관리자</Badge>;
      case "COUNSELOR":
        return <Badge className="bg-blue-500">상담사</Badge>;
      default:
        return <Badge variant="secondary">내담자</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium">오류가 발생했습니다</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={loadDashboardData} className="ml-auto">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground">시스템 전체 현황을 관리합니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              상담사 {stats?.totalCounselors || 0}명 포함
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 예약</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              전체 {stats?.totalAppointments || 0}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료율</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalAppointments
                ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              완료 {stats?.completedAppointments || 0}건 / 취소 {stats?.cancelledAppointments || 0}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">완료된 상담 기준</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 콘텐츠 */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">최근 예약</TabsTrigger>
          <TabsTrigger value="users">사용자 관리</TabsTrigger>
          <TabsTrigger value="counselors">상담사 관리</TabsTrigger>
        </TabsList>

        {/* 최근 예약 */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>최근 예약</CardTitle>
              <CardDescription>최근 10건의 예약 현황입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">예약이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {apt.client.name || apt.client.email}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            상담사: {apt.counselor.user.name || "미지정"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">
                            {formatDateKST(new Date(apt.startTime), "M월 d일")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTimeKST(new Date(apt.startTime))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(apt.price)}</p>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 사용자 관리 */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>사용자 관리</CardTitle>
              <CardDescription>사용자 역할을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">사용자가 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{user.name || "이름 없음"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                        >
                          <option value="CLIENT">내담자</option>
                          <option value="COUNSELOR">상담사</option>
                          <option value="ADMIN">관리자</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상담사 관리 */}
        <TabsContent value="counselors">
          <Card>
            <CardHeader>
              <CardTitle>상담사 관리</CardTitle>
              <CardDescription>상담사 활성화 상태를 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {counselors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">상담사가 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {counselors.map((counselor) => (
                    <div
                      key={counselor.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{counselor.user.name || "이름 없음"}</p>
                        <p className="text-sm text-muted-foreground">{counselor.user.email}</p>
                        <div className="flex gap-1 mt-1">
                          {counselor.specialties.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">{formatPrice(counselor.sessionPrice)}/회</p>
                          <p className="text-sm text-muted-foreground">
                            상담 {counselor._count.appointments}건
                          </p>
                        </div>
                        <Button
                          variant={counselor.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleCounselorStatus(counselor.id, !counselor.isActive)}
                        >
                          {counselor.isActive ? (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              비활성화
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              활성화
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
