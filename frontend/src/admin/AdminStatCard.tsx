import React from 'react';

import { Card, CardContent } from '../components/ui/card';
import { cn } from '../components/ui/utils';

type Tone = 'default' | 'info' | 'positive' | 'warning';

const toneStyles: Record<Tone, { icon: string; value: string }> = {
  default: {
    icon: 'bg-muted text-foreground/80',
    value: 'text-foreground'
  },
  info: {
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400'
  },
  positive: {
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400'
  },
  warning: {
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400'
  }
};

interface AdminStatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  helperText?: string;
  tone?: Tone;
  className?: string;
  iconClassName?: string;
}

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  helperText,
  tone = 'default',
  className,
  iconClassName
}: AdminStatCardProps) {
  const toneClass = toneStyles[tone];

  return (
    <Card className={cn('border-border/60 shadow-none', className)} role="group" aria-label={`${label}: ${value}`}>
      <CardContent className="flex items-center gap-3 p-4">
        {Icon ? (
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
              toneClass.icon,
              iconClassName
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn('text-2xl font-semibold leading-tight', toneClass.value)}>{value}</p>
          {helperText ? <p className="mt-1 text-xs text-muted-foreground">{helperText}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
