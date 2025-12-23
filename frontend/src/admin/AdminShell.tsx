import type { LucideIcon } from 'lucide-react';
import { LogOut, Menu, Shield, X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';

interface AdminShellNavItem {
  value: string;
  label: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  description?: string;
}

interface AdminShellProps {
  admin?: { email?: string | null; role?: string | null; name?: string | null } | null;
  onLogout?: () => void;
  navItems: AdminShellNavItem[];
  activeItem: string;
  onSelect: (value: string) => void;
  headerActions?: React.ReactNode;
  lastUpdatedLabel?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({
  admin,
  onLogout,
  navItems,
  activeItem,
  onSelect,
  headerActions,
  lastUpdatedLabel,
  children
}: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const renderNav = (orientation: 'vertical' | 'horizontal') => (
    <nav className={cn('space-y-1', orientation === 'horizontal' && 'flex flex-row items-center gap-1 space-y-0')}>
      {navItems.map((item) => {
        const isActive = item.value === activeItem;
        return (
          <Button
            key={item.value}
            type="button"
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-3 text-sm font-medium transition-colors',
              orientation === 'horizontal' && 'w-auto px-3 py-2',
              !isActive && 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => {
              onSelect(item.value);
              setMobileNavOpen(false);
            }}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
            {item.badge ? <span className="ml-auto text-xs text-muted-foreground">{item.badge}</span> : null}
          </Button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      {/* Mobile navigation */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 grid grid-cols-[minmax(0,1fr)] lg:hidden">
          <div className="h-full w-full bg-background shadow-xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Admin Console</p>
                  <p className="text-xs text-muted-foreground">Manage the platform</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-4 py-4 space-y-6">
              {renderNav('vertical')}
              {admin ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">{admin.name || admin.email}</p>
                  <p className="text-muted-foreground">{admin.role || 'Administrator'}</p>
                </div>
              ) : null}
              {onLogout ? (
                <Button
                  variant="outline"
                  className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    onLogout();
                    setMobileNavOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="h-full w-full bg-black/40"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        </div>
      ) : null}

      <div className="container mx-auto flex min-h-screen flex-col px-4 py-4 lg:flex-row lg:gap-8 lg:py-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="rounded-2xl border bg-background/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 border-b px-5 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Admin Console</p>
                <p className="text-xs text-muted-foreground">Mental Wellbeing AI</p>
              </div>
            </div>
            <div className="px-3 py-4 space-y-6">
              {renderNav('vertical')}
              {admin ? (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{admin.name || 'Admin'}</p>
                    {admin.role ? <span className="text-xs text-muted-foreground">{admin.role}</span> : null}
                  </div>
                  {admin.email ? <p className="break-all text-xs text-muted-foreground">{admin.email}</p> : null}
                  {onLogout ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={onLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-6 lg:space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/90 px-4 py-4 shadow-sm sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-base font-semibold sm:text-lg">Platform Administration</p>
                <p className="text-xs text-muted-foreground sm:text-sm">Manage practices, content, assessments, and more.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {lastUpdatedLabel ? (
                <span className="hidden text-xs text-muted-foreground sm:inline-flex items-center gap-1">
                  {lastUpdatedLabel}
                </span>
              ) : null}
              {headerActions ? <div className="flex flex-wrap items-center gap-2">{headerActions}</div> : null}
            </div>
          </header>

          <div className="rounded-2xl border bg-background/90 p-4 shadow-sm sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
