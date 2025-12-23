import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader } from '../components/ui/card';
import { cn } from '../components/ui/utils';

import { AdminSectionHeader } from './AdminSectionHeader';

interface AdminSectionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  iconClassName?: string;
}

export function AdminSectionCard({
  icon,
  title,
  description,
  actions,
  children,
  headerClassName,
  contentClassName,
  iconClassName
}: AdminSectionCardProps) {
  return (
    <Card>
      <CardHeader className={cn('pb-4', headerClassName)}>
        <AdminSectionHeader
          icon={icon}
          title={title}
          description={description}
          actions={actions}
          iconClassName={iconClassName}
        />
      </CardHeader>
      <CardContent className={cn('pt-0', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
