"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Plus, Layers, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Layers className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Xin chào, {user.displayName?.split(" ").pop() || "bạn"} 👋
          </h1>
          <p className="text-muted-foreground mt-2">Hôm nay học gì?</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button className="flex-1 gap-2 h-11" asChild>
            <Link href="/dashboard">
              <Layers className="h-4 w-4" />
              Decks của tôi
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 gap-2 h-11" asChild>
            <Link href="/deck/create">
              <Plus className="h-4 w-4" />
              Tạo mới
            </Link>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
          <Link href="/explore">
            <BookOpen className="h-4 w-4" />
            Khám phá bộ từ
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-24 flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Layers className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ANN Flash</h1>
        <p className="text-muted-foreground mt-2">Ứng dụng học flashcard</p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Button className="w-full gap-2 h-11" asChild>
          <Link href="/login">
            Đăng nhập
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" className="w-full h-11" asChild>
          <Link href="/register">Đăng ký tài khoản</Link>
        </Button>
      </div>
    </div>
  );
}
