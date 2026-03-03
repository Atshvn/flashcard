"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  progress?: number;
  variant?: "default" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-500",
  warning: "bg-amber-500/10 text-amber-500",
  info: "bg-blue-500/10 text-blue-500",
};

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  variant = "default",
}: AnalyticsCardProps) {
  return (
    <Card className="border-border/50 hover:border-primary/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${variantStyles[variant]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}
