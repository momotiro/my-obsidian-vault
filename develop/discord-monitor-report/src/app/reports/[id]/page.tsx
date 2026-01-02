"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";

interface Comment {
  comment_id: number;
  user_id: number;
  user_name: string;
  target_field: "problem" | "plan";
  comment_text: string;
  created_at: string;
}

interface Report {
  report_id: number;
  user_id: number;
  user_name: string;
  report_date: string;
  problem: string | null;
  plan: string | null;
  monitoring_records: Array<{
    record_id: number;
    server_id: number;
    server_name: string;
    monitoring_content: string;
  }>;
  comments: Comment[];
  created_at: string;
  updated_at: string;
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [problemComment, setProblemComment] = useState("");
  const [planComment, setPlanComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiClient<{ success: boolean; data: Report }>(
        `/api/reports/${reportId}`
      );
      setReport(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "日報の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitComment = async (targetField: "problem" | "plan") => {
    const commentText =
      targetField === "problem" ? problemComment : planComment;

    if (!commentText.trim()) {
      return;
    }

    setIsSubmittingComment(targetField);

    try {
      await apiClient(`/api/reports/${reportId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          target_field: targetField,
          comment_text: commentText.trim(),
        }),
      });

      // Clear input and refresh report
      if (targetField === "problem") {
        setProblemComment("");
      } else {
        setPlanComment("");
      }

      await fetchReport();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "コメントの投稿に失敗しました"
      );
    } finally {
      setIsSubmittingComment(null);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const canEdit = user && report && user.id === report.user_id;
  const canComment = user && user.role === "manager";

  const problemComments = report?.comments.filter(
    (c) => c.target_field === "problem"
  ) || [];
  const planComments = report?.comments.filter(
    (c) => c.target_field === "plan"
  ) || [];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !report) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center text-red-600">
              {error || "日報が見つかりません"}
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/reports")}
            >
              ← 戻る
            </Button>
            {canEdit && (
              <Button onClick={() => router.push(`/reports/${reportId}/edit`)}>
                編集
              </Button>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-6">
            {formatDate(report.report_date)} の日報 - {report.user_name}
          </h2>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>監視報告</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.monitoring_records.map((record) => (
                  <div key={record.record_id} className="space-y-2">
                    <h3 className="font-semibold">● {record.server_name}</h3>
                    <div className="ml-4 whitespace-pre-wrap text-gray-700">
                      {record.monitoring_content}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {report.problem && (
              <Card>
                <CardHeader>
                  <CardTitle>Problem (課題・相談)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {report.problem}
                  </div>

                  {problemComments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <span>💬</span>
                        コメント
                      </h4>
                      {problemComments.map((comment) => (
                        <div
                          key={comment.comment_id}
                          className="p-4 bg-blue-50 rounded-md"
                        >
                          <div className="text-sm text-gray-600 mb-2">
                            {comment.user_name} - {formatDateTime(comment.created_at)}
                          </div>
                          <div className="whitespace-pre-wrap">
                            {comment.comment_text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {canComment && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">コメントを追加</h4>
                      <Textarea
                        value={problemComment}
                        onChange={(e) => setProblemComment(e.target.value)}
                        placeholder="コメントを入力してください"
                        rows={3}
                        disabled={isSubmittingComment === "problem"}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => submitComment("problem")}
                          disabled={
                            !problemComment.trim() ||
                            isSubmittingComment === "problem"
                          }
                        >
                          {isSubmittingComment === "problem"
                            ? "投稿中..."
                            : "投稿"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {report.plan && (
              <Card>
                <CardHeader>
                  <CardTitle>Plan (明日の予定)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {report.plan}
                  </div>

                  {planComments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <span>💬</span>
                        コメント
                      </h4>
                      {planComments.map((comment) => (
                        <div
                          key={comment.comment_id}
                          className="p-4 bg-blue-50 rounded-md"
                        >
                          <div className="text-sm text-gray-600 mb-2">
                            {comment.user_name} - {formatDateTime(comment.created_at)}
                          </div>
                          <div className="whitespace-pre-wrap">
                            {comment.comment_text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {canComment && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">コメントを追加</h4>
                      <Textarea
                        value={planComment}
                        onChange={(e) => setPlanComment(e.target.value)}
                        placeholder="コメントを入力してください"
                        rows={3}
                        disabled={isSubmittingComment === "plan"}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => submitComment("plan")}
                          disabled={
                            !planComment.trim() ||
                            isSubmittingComment === "plan"
                          }
                        >
                          {isSubmittingComment === "plan"
                            ? "投稿中..."
                            : "投稿"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
