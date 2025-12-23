import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '../components/ui/utils';

interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}

export function AdminSectionHeader({
  title,
  description,
  actions,
  className,
  icon,
  iconClassName
}: AdminSectionHeaderProps) {
  const Icon = icon;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className="flex w-full items-start gap-3 sm:gap-4">
        {Icon ? (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary',
              iconClassName
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3" aria-label="section actions">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
