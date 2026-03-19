"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, LayoutDashboard, LogOut, Menu, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useIsStudyMode } from "@/hooks/useIsStudyMode";

export function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isStudy = useIsStudyMode();

  // Hide completely in study/focus mode
  if (isStudy) return null;

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container flex h-14 md:h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0 shadow-sm bg-muted flex items-center justify-center">
              <Image
                src="/logo.jpg"
                alt="ANN Flash Logo"
                width={32}
                height={32}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <span className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
              ANN Flash
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {loading ? (
              <>
                <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
              </>
            ) : (
              user && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/deck/create" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Deck
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/explore" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Explore
                    </Link>
                  </Button>
                </>
              )
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                {/* Desktop user menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-full"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {getInitials(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <div className="flex items-center gap-2 p-2">
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-sm font-medium">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile menu */}
                <div className="md:hidden">
                  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                      <SheetTitle className="sr-only">
                        Navigation Menu
                      </SheetTitle>
                      <div className="flex flex-col gap-4 mt-8">
                        <div className="flex items-center gap-3 px-2">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(user.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {user.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="border-t pt-4 flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            className="justify-start gap-2"
                            asChild
                            onClick={() => setMobileOpen(false)}
                          >
                            <Link href="/dashboard">
                              <LayoutDashboard className="h-4 w-4" />
                              Dashboard
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start gap-2"
                            asChild
                            onClick={() => setMobileOpen(false)}
                          >
                            <Link href="/deck/create">
                              <Plus className="h-4 w-4" />
                              Create Deck
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start gap-2"
                            asChild
                            onClick={() => setMobileOpen(false)}
                          >
                            <Link href="/explore">
                              <BookOpen className="h-4 w-4" />
                              Explore
                            </Link>
                          </Button>
                        </div>
                        <div className="border-t pt-4">
                          <Button
                            variant="ghost"
                            className="justify-start gap-2 text-destructive hover:text-destructive w-full"
                            onClick={() => {
                              handleLogout();
                              setMobileOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation — Telegram floating pill */}
      {user && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-4 mb-4">
            <div className="flex items-center justify-around rounded-[28px] bg-background/75 backdrop-blur-2xl border border-border/20 shadow-[0_8px_32px_rgba(0,0,0,0.22)] px-2 py-2">
              {([
                { href: "/dashboard", icon: LayoutDashboard, label: "Decks" },
                { href: "/deck/create", icon: Plus, label: "Tạo mới", isCreate: true },
                { href: "/explore", icon: BookOpen, label: "Khám phá" },
              ] as { href: string; icon: React.ElementType; label: string; isCreate?: boolean }[]).map(({ href, icon: Icon, label, isCreate }) => {
                const active = pathname === href || pathname.startsWith(href);
                if (isCreate) {
                  return (
                    <Link key={href} href={href}
                      className="flex flex-col items-center gap-1 py-1 flex-1 touch-manipulation"
                    >
                      <div className="h-11 w-11 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                        <Icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
                    </Link>
                  );
                }
                return (
                  <Link key={href} href={href}
                    className="flex flex-col items-center gap-1 py-1 flex-1 touch-manipulation"
                  >
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      active ? "bg-primary/15" : ""
                    }`}>
                      <Icon className={`h-5 w-5 transition-colors duration-200 ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
