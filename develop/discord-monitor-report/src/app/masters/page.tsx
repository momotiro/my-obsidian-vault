"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";

interface Server {
  server_id: number;
  server_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function MastersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"servers" | "users">("servers");
  const [servers, setServers] = useState<Server[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Server form
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");
  const [serverIsActive, setServerIsActive] = useState(true);

  // User form
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<"staff" | "manager">("staff");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (activeTab === "servers") {
        const data = await apiClient<{ success: boolean; data: { servers: Server[] } }>(
          "/api/masters/servers"
        );
        setServers(data.data.servers);
      } else {
        const data = await apiClient<{ success: boolean; data: { users: User[] } }>(
          "/api/masters/users"
        );
        setUsers(data.data.users);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "データの取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item: Server | User) => {
    setModalMode("edit");
    if (activeTab === "servers") {
      const server = item as Server;
      setEditingId(server.server_id);
      setServerName(server.server_name);
      setServerDescription(server.description);
      setServerIsActive(server.is_active);
    } else {
      const user = item as User;
      setEditingId(user.user_id);
      setUserName(user.name);
      setUserEmail(user.email);
      setUserPassword("");
      setUserRole(user.role as "staff" | "manager");
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setServerName("");
    setServerDescription("");
    setServerIsActive(true);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("staff");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (activeTab === "servers") {
        const data = {
          server_name: serverName,
          description: serverDescription,
          is_active: serverIsActive,
        };

        if (modalMode === "create") {
          await apiClient("/api/masters/servers", {
            method: "POST",
            body: JSON.stringify(data),
          });
        } else if (editingId) {
          await apiClient(`/api/masters/servers/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
        }
      } else {
        const data: any = {
          name: userName,
          email: userEmail,
          role: userRole,
        };

        if (modalMode === "create" || userPassword) {
          data.password = userPassword;
        }

        if (modalMode === "create") {
          await apiClient("/api/masters/users", {
            method: "POST",
            body: JSON.stringify(data),
          });
        } else if (editingId) {
          await apiClient(`/api/masters/users/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
        }
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "保存に失敗しました"
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("本当に削除しますか?")) {
      return;
    }

    setError("");

    try {
      if (activeTab === "servers") {
        await apiClient(`/api/masters/servers/${id}`, {
          method: "DELETE",
        });
      } else {
        await apiClient(`/api/masters/users/${id}`, {
          method: "DELETE",
        });
      }

      fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "削除に失敗しました"
      );
    }
  };

  return (
    <ProtectedRoute requireRole="manager">
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/reports")}
              className="mb-4"
            >
              ← 戻る
            </Button>
            <h2 className="text-2xl font-bold">マスタ管理</h2>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="mb-6 flex gap-4 border-b">
            <button
              onClick={() => setActiveTab("servers")}
              className={`pb-2 px-4 font-medium ${
                activeTab === "servers"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Discordサーバー
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-2 px-4 font-medium ${
                activeTab === "users"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              担当者
            </button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {activeTab === "servers"
                    ? "Discordサーバー管理"
                    : "担当者管理"}
                </CardTitle>
                <Button onClick={openCreateModal}>
                  + {activeTab === "servers" ? "新規サーバー追加" : "新規担当者追加"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              ) : activeTab === "servers" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>サーバー名</TableHead>
                      <TableHead>説明</TableHead>
                      <TableHead>状態</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.map((server) => (
                      <TableRow key={server.server_id}>
                        <TableCell className="font-medium">
                          {server.server_name}
                        </TableCell>
                        <TableCell>{server.description}</TableCell>
                        <TableCell>
                          {server.is_active ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              有効
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              無効
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(server)}
                            >
                              編集
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(server.server_id)}
                            >
                              削除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名前</TableHead>
                      <TableHead>メールアドレス</TableHead>
                      <TableHead>役割</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.role === "manager" ? "上長" : "担当者"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(user)}
                            >
                              編集
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(user.user_id)}
                            >
                              削除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">
                  {modalMode === "create" ? "新規" : "編集"} -{" "}
                  {activeTab === "servers" ? "サーバー" : "担当者"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {activeTab === "servers" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="server_name">サーバー名</Label>
                        <Input
                          id="server_name"
                          value={serverName}
                          onChange={(e) => setServerName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">説明</Label>
                        <Input
                          id="description"
                          value={serverDescription}
                          onChange={(e) => setServerDescription(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={serverIsActive}
                          onChange={(e) => setServerIsActive(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="is_active">有効</Label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="user_name">名前</Label>
                        <Input
                          id="user_name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user_email">メールアドレス</Label>
                        <Input
                          id="user_email"
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user_password">
                          パスワード
                          {modalMode === "edit" && " (変更する場合のみ入力)"}
                        </Label>
                        <Input
                          id="user_password"
                          type="password"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          required={modalMode === "create"}
                          placeholder={
                            modalMode === "edit" ? "変更しない場合は空欄" : ""
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user_role">役割</Label>
                        <Select
                          id="user_role"
                          value={userRole}
                          onChange={(e) =>
                            setUserRole(e.target.value as "staff" | "manager")
                          }
                          required
                        >
                          <option value="staff">担当者</option>
                          <option value="manager">上長</option>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button type="submit">保存</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
