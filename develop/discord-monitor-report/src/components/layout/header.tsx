"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/reports">
              <h1 className="text-xl font-bold">Discord監視日報システム</h1>
            </Link>
            <nav className="flex gap-4">
              <Link href="/reports">
                <Button variant="ghost">日報一覧</Button>
              </Link>
              <Link href="/reports/new">
                <Button variant="ghost">新規日報作成</Button>
              </Link>
              {user?.role === "manager" && (
                <Link href="/masters">
                  <Button variant="ghost">マスタ管理</Button>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              ようこそ、{user?.name}さん
            </span>
            <Button variant="outline" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
