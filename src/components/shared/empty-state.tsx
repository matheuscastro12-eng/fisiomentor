"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="bg-surface-container-low">
      <CardContent className="flex flex-col items-center text-center py-16">
        <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="font-display text-title-lg text-on-surface mb-2">
          {title}
        </h3>
        <p className="font-body text-body-md text-on-surface-variant mb-6 max-w-md">
          {description}
        </p>
        {actionLabel && actionHref && (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
