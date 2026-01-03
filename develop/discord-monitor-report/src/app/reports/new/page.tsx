"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

interface Server {
  server_id: number;
  server_name: string;
  description: string;
  is_active: boolean;
}

interface MonitoringRecord {
  server_id: number;
  monitoring_content: string;
}

export default function NewReportPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [monitoringRecords, setMonitoringRecords] = useState<
    MonitoringRecord[]
  >([{ server_id: 0, monitoring_content: "" }]);
  const [problem, setProblem] = useState("");
  const [plan, setPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const data = await apiClient<{ success: boolean; data: { servers: Server[] } }>(
        "/api/masters/servers?is_active=true"
      );
      setServers(data.data.servers);

      // Set first server as default if available
      if (data.data.servers.length > 0 && monitoringRecords[0].server_id === 0) {
        setMonitoringRecords([
          { server_id: data.data.servers[0].server_id, monitoring_content: "" },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch servers:", err);
    }
  };

  const addMonitoringRecord = () => {
    const defaultServerId =
      servers.length > 0 ? servers[0].server_id : 0;
    setMonitoringRecords([
      ...monitoringRecords,
      { server_id: defaultServerId, monitoring_content: "" },
    ]);
  };

  const removeMonitoringRecord = (index: number) => {
    if (monitoringRecords.length > 1) {
      setMonitoringRecords(monitoringRecords.filter((_, i) => i !== index));
    }
  };

  const updateMonitoringRecord = (
    index: number,
    field: keyof MonitoringRecord,
    value: string | number
  ) => {
    const updated = [...monitoringRecords];
    updated[index] = { ...updated[index], [field]: value };
    setMonitoringRecords(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (monitoringRecords.length === 0) {
      setError("監視報告は1件以上必要です");
      return;
    }

    for (const record of monitoringRecords) {
      if (!record.server_id || !record.monitoring_content.trim()) {
        setError("すべての監視報告を入力してください");
        return;
      }
    }

    setIsLoading(true);

    try {
      await apiClient("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          report_date: reportDate,
          problem: problem.trim() || null,
          plan: plan.trim() || null,
          monitoring_records: monitoringRecords,
        }),
      });

      router.push("/reports");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "日報の作成に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/reports")}
              className="mb-4"
            >
              ← 戻る
            </Button>
            <h2 className="text-2xl font-bold">日報作成</h2>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="report_date">日付</Label>
                  <Input
                    id="report_date"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>監視報告</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {monitoringRecords.map((record, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-md space-y-4 relative"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`server-${index}`}>サーバー</Label>
                      <Select
                        id={`server-${index}`}
                        value={record.server_id}
                        onChange={(e) =>
                          updateMonitoringRecord(
                            index,
                            "server_id",
                            parseInt(e.target.value)
                          )
                        }
                        required
                        disabled={isLoading}
                      >
                        <option value="">サーバーを選択</option>
                        {servers.map((server) => (
                          <option key={server.server_id} value={server.server_id}>
                            {server.server_name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`content-${index}`}>監視内容</Label>
                      <Textarea
                        id={`content-${index}`}
                        value={record.monitoring_content}
                        onChange={(e) =>
                          updateMonitoringRecord(
                            index,
                            "monitoring_content",
                            e.target.value
                          )
                        }
                        placeholder="監視内容を入力してください"
                        rows={4}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {monitoringRecords.length > 1 && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMonitoringRecord(index)}
                          disabled={isLoading}
                        >
                          削除
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addMonitoringRecord}
                  disabled={isLoading}
                  className="w-full"
                >
                  + 監視報告を追加
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="problem">Problem (課題・相談)</Label>
                  <Textarea
                    id="problem"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="課題や相談事項があれば入力してください"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Plan (明日の予定)</Label>
                  <Textarea
                    id="plan"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="明日の予定を入力してください"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/reports")}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
