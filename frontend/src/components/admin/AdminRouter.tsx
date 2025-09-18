import React from 'react';

import { AdminProtectedRoute } from '../features/auth/AdminProtectedRoute';

import { AdminDashboard } from './AdminDashboard';
import { AdminLayout } from './AdminLayout';

type AdminPage = 
  | 'dashboard'
  | 'content'
  | 'content-list'
  | 'content-upload'
  | 'content-categories'
  | 'practices'
  | 'practices-list'
  | 'practices-upload'
  | 'playlists'
  | 'users'
  | 'analytics'
  | 'analytics-overview'
  | 'analytics-engagement'
  | 'analytics-content'
  | 'notifications'
  | 'security'
  | 'settings'
  | 'help'
  | '404';

interface AdminRouterProps {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
}

interface AdminPageConfig {
  component: React.ComponentType<{ onNavigate?: (page: AdminPage) => void }>;
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  requiresPermissions?: string[];
}

// Placeholder component for pages not yet implemented
const AdminPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
    <div className="max-w-md mx-auto">
      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <div className="w-8 h-8 bg-gray-600 rounded animate-pulse"></div>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">
        This page is under construction. The {title.toLowerCase()} functionality will be available soon.
      </p>
      <div className="bg-gray-700 rounded-lg p-4 text-left">
        <h3 className="text-sm font-medium text-white mb-2">Coming Soon:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Comprehensive {title.toLowerCase()} interface</li>
          <li>• Advanced filtering and search</li>
          <li>• Real-time updates and notifications</li>
          <li>• Export and reporting capabilities</li>
        </ul>
      </div>
    </div>
  </div>
);

// 404 component for admin area
const AdminNotFound: React.FC = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
    <div className="max-w-md mx-auto">
      <div className="text-6xl font-bold text-gray-600 mb-4">404</div>
      <h2 className="text-xl font-semibold text-white mb-2">Admin Page Not Found</h2>
      <p className="text-gray-400 mb-6">
        The admin page you are looking for does not exist or has been moved.
      </p>
      <button
        onClick={() => window.location.href = '/admin/dashboard'}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  </div>
);

// Loading component for admin page transitions
export const AdminLoading: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-400">Loading admin page...</p>
    </div>
  </div>
);

const adminPages: Record<AdminPage, AdminPageConfig> = {
  dashboard: {
    component: AdminDashboard,
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Dashboard' }]
  },
  content: {
    component: () => <AdminPlaceholder title="Content Library" />,
    title: 'Content Library',
    breadcrumbs: [{ label: 'Content Library' }]
  },
  'content-list': {
    component: () => <AdminPlaceholder title="All Content" />,
    title: 'All Content',
    breadcrumbs: [
      { label: 'Content Library', href: '/admin/content' },
      { label: 'All Content' }
    ]
  },
  'content-upload': {
    component: () => <AdminPlaceholder title="Upload Content" />,
    title: 'Upload Content',
    breadcrumbs: [
      { label: 'Content Library', href: '/admin/content' },
      { label: 'Upload Content' }
    ],
    requiresPermissions: ['content_create']
  },
  'content-categories': {
    component: () => <AdminPlaceholder title="Content Categories" />,
    title: 'Content Categories',
    breadcrumbs: [
      { label: 'Content Library', href: '/admin/content' },
      { label: 'Categories' }
    ]
  },
  practices: {
    component: () => <AdminPlaceholder title="Practice Library" />,
    title: 'Practice Library',
    breadcrumbs: [{ label: 'Practice Library' }]
  },
  'practices-list': {
    component: () => <AdminPlaceholder title="All Practices" />,
    title: 'All Practices',
    breadcrumbs: [
      { label: 'Practice Library', href: '/admin/practices' },
      { label: 'All Practices' }
    ]
  },
  'practices-upload': {
    component: () => <AdminPlaceholder title="Upload Practice" />,
    title: 'Upload Practice',
    breadcrumbs: [
      { label: 'Practice Library', href: '/admin/practices' },
      { label: 'Upload Practice' }
    ],
    requiresPermissions: ['practices_create']
  },
  playlists: {
    component: () => <AdminPlaceholder title="Playlists" />,
    title: 'Playlists',
    breadcrumbs: [
      { label: 'Practice Library', href: '/admin/practices' },
      { label: 'Playlists' }
    ]
  },
  users: {
    component: () => <AdminPlaceholder title="User Management" />,
    title: 'User Management',
    breadcrumbs: [{ label: 'User Management' }],
    requiresPermissions: ['users_view']
  },
  analytics: {
    component: () => <AdminPlaceholder title="Analytics & Reports" />,
    title: 'Analytics & Reports',
    breadcrumbs: [{ label: 'Analytics & Reports' }]
  },
  'analytics-overview': {
    component: () => <AdminPlaceholder title="Analytics Overview" />,
    title: 'Analytics Overview',
    breadcrumbs: [
      { label: 'Analytics & Reports', href: '/admin/analytics' },
      { label: 'Overview' }
    ]
  },
  'analytics-engagement': {
    component: () => <AdminPlaceholder title="User Engagement" />,
    title: 'User Engagement',
    breadcrumbs: [
      { label: 'Analytics & Reports', href: '/admin/analytics' },
      { label: 'User Engagement' }
    ]
  },
  'analytics-content': {
    component: () => <AdminPlaceholder title="Content Performance" />,
    title: 'Content Performance',
    breadcrumbs: [
      { label: 'Analytics & Reports', href: '/admin/analytics' },
      { label: 'Content Performance' }
    ]
  },
  notifications: {
    component: () => <AdminPlaceholder title="Notifications" />,
    title: 'Notifications',
    breadcrumbs: [{ label: 'Notifications' }]
  },
  security: {
    component: () => <AdminPlaceholder title="Security & Access" />,
    title: 'Security & Access',
    breadcrumbs: [{ label: 'Security & Access' }],
    requiresPermissions: ['security_view']
  },
  settings: {
    component: () => <AdminPlaceholder title="Admin Settings" />,
    title: 'Admin Settings',
    breadcrumbs: [{ label: 'Admin Settings' }],
    requiresPermissions: ['settings_manage']
  },
  help: {
    component: () => <AdminPlaceholder title="Help & Support" />,
    title: 'Help & Support',
    breadcrumbs: [{ label: 'Help & Support' }]
  },
  '404': {
    component: AdminNotFound,
    title: 'Page Not Found',
    breadcrumbs: [{ label: 'Error' }]
  }
};

// Main admin router component
export const AdminRouter: React.FC<AdminRouterProps> = ({ currentPage, onNavigate }) => {
  const pageConfig = adminPages[currentPage] || adminPages['404'];
  const PageComponent = pageConfig.component;

  return (
    <AdminProtectedRoute>
      <AdminLayout 
        currentPage={currentPage}
        breadcrumbs={pageConfig.breadcrumbs}
      >
        <div className="admin-page-content">
          <PageComponent onNavigate={onNavigate} />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

// Hook for admin navigation
export const useAdminNavigation = () => {
  const [currentPage, setCurrentPage] = React.useState<AdminPage>('dashboard');
  const [isLoading, setIsLoading] = React.useState(false);

  const navigateTo = async (page: AdminPage) => {
    setIsLoading(true);
    
    // Simulate page transition delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setCurrentPage(page);
    setIsLoading(false);
    
    // Update URL in real router implementation
    console.log('Navigate to admin page:', page);
  };

  const goBack = () => {
    window.history.back();
  };

  const refresh = () => {
    window.location.reload();
  };

  return {
    currentPage,
    isLoading,
    navigateTo,
    goBack,
    refresh
  };
};

// Export admin page types for use in other components
export type { AdminPage };
export { adminPages };