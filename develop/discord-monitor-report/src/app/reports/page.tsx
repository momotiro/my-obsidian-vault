"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { apiClient } from "@/lib/api-client";

interface Report {
  report_id: number;
  user_id: number;
  user_name: string;
  report_date: string;
  monitoring_count: number;
  comment_count: number;
  has_unread_comments: boolean;
  created_at: string;
  updated_at: string;
}

interface ReportsResponse {
  reports: Report[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    limit: number;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("this-week");

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (selectedPeriod) {
        case "today":
          startDate = new Date(now);
          break;
        case "this-week": {
          const dayOfWeek = now.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
          startDate = new Date(now);
          startDate.setDate(now.getDate() - diff);
          break;
        }
        case "this-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "all":
        default:
          startDate = new Date(2020, 0, 1); // Far past date
          break;
      }

      const formatDate = (date: Date) => {
        return date.toISOString().split("T")[0];
      };

      const queryParams = new URLSearchParams({
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      });

      const data = await apiClient<ReportsResponse>(
        `/api/reports?${queryParams.toString()}`
      );

      setReports(data.reports);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "日報の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${year}/${month}/${day} (${weekday})`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">日報一覧</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">期間:</label>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-40"
                >
                  <option value="today">今日</option>
                  <option value="this-week">今週</option>
                  <option value="this-month">今月</option>
                  <option value="all">すべて</option>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                日報がありません
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card
                  key={report.report_id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/reports/${report.report_id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold">
                            {formatDate(report.report_date)} - {report.user_name}
                          </h3>
                          {report.has_unread_comments && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                              新着コメント
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>監視サーバー: {report.monitoring_count}件</span>
                          <span>
                            コメント:{" "}
                            {report.comment_count > 0
                              ? `${report.comment_count}件`
                              : "なし"}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline">詳細を見る</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
