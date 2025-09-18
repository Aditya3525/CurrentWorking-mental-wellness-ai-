import { ChevronRight, Menu, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  breadcrumbs?: BreadcrumbItem[];
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  currentPage, 
  breadcrumbs = [] 
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && isMobile) {
        const target = event.target as Element;
        if (!target.closest('.admin-sidebar') && !target.closest('.mobile-menu-toggle')) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen, isMobile]);

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Admin Panel', href: '/admin' },
    ...breadcrumbs
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="mobile-menu-toggle lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
        aria-label="Toggle admin menu"
      >
        {mobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-100" />
        ) : (
          <Menu className="w-5 h-5 text-gray-100" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"></div>
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${
        isMobile 
          ? (mobileMenuOpen ? 'translate-x-0' : '-translate-x-full')
          : 'translate-x-0'
      }`}>
        <AdminSidebar 
          currentPage={currentPage}
          collapsed={sidebarCollapsed && !isMobile}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${
        !isMobile 
          ? (sidebarCollapsed ? 'ml-16' : 'ml-64')
          : 'ml-0'
      }`}>
        {/* Admin Header */}
        <AdminHeader />

        {/* Breadcrumb Navigation */}
        {defaultBreadcrumbs.length > 1 && (
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
            <nav className="flex items-center space-x-2 text-sm">
              {defaultBreadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  {breadcrumb.href ? (
                    <button
                      onClick={() => {
                        // Handle navigation - this would be connected to your routing system
                        console.log('Navigate to:', breadcrumb.href);
                      }}
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {breadcrumb.icon && (
                        <span className="w-4 h-4">{breadcrumb.icon}</span>
                      )}
                      <span>{breadcrumb.label}</span>
                    </button>
                  ) : (
                    <span className="flex items-center space-x-1 text-gray-400">
                      {breadcrumb.icon && (
                        <span className="w-4 h-4">{breadcrumb.icon}</span>
                      )}
                      <span>{breadcrumb.label}</span>
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Loading Overlay (when needed) */}
      <div id="admin-loading-overlay" className="hidden fixed inset-0 bg-gray-950 bg-opacity-75 z-50 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-100">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility function to show/hide loading overlay
export const showAdminLoading = () => {
  const overlay = document.getElementById('admin-loading-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
  }
};

export const hideAdminLoading = () => {
  const overlay = document.getElementById('admin-loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
};

// Hook for managing breadcrumbs
export const useAdminBreadcrumbs = (breadcrumbs: BreadcrumbItem[]) => {
  const [currentBreadcrumbs, setCurrentBreadcrumbs] = useState<BreadcrumbItem[]>(breadcrumbs);

  const updateBreadcrumbs = (newBreadcrumbs: BreadcrumbItem[]) => {
    setCurrentBreadcrumbs(newBreadcrumbs);
  };

  const addBreadcrumb = (breadcrumb: BreadcrumbItem) => {
    setCurrentBreadcrumbs(prev => [...prev, breadcrumb]);
  };

  return {
    breadcrumbs: currentBreadcrumbs,
    updateBreadcrumbs,
    addBreadcrumb
  };
};