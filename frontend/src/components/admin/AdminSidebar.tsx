import { 
  BarChart3, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Home, 
  Settings, 
  Users, 
  Activity,
  Shield,
  Bell,
  HelpCircle
} from 'lucide-react';
import React from 'react';

interface AdminSidebarProps {
  currentPage: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (page: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: string;
  subItems?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    href: '/admin/dashboard'
  },
  {
    id: 'content',
    label: 'Content Library',
    icon: <FileText className="w-5 h-5" />,
    href: '/admin/content',
    subItems: [
      {
        id: 'content-list',
        label: 'All Content',
        icon: <FileText className="w-4 h-4" />,
        href: '/admin/content/list'
      },
      {
        id: 'content-upload',
        label: 'Upload Content',
        icon: <FileText className="w-4 h-4" />,
        href: '/admin/content/upload'
      },
      {
        id: 'content-categories',
        label: 'Categories',
        icon: <FileText className="w-4 h-4" />,
        href: '/admin/content/categories'
      }
    ]
  },
  {
    id: 'practices',
    label: 'Practice Library',
    icon: <BookOpen className="w-5 h-5" />,
    href: '/admin/practices',
    subItems: [
      {
        id: 'practices-list',
        label: 'All Practices',
        icon: <BookOpen className="w-4 h-4" />,
        href: '/admin/practices/list'
      },
      {
        id: 'practices-upload',
        label: 'Upload Practice',
        icon: <BookOpen className="w-4 h-4" />,
        href: '/admin/practices/upload'
      },
      {
        id: 'playlists',
        label: 'Playlists',
        icon: <BookOpen className="w-4 h-4" />,
        href: '/admin/practices/playlists'
      }
    ]
  },
  {
    id: 'users',
    label: 'User Management',
    icon: <Users className="w-5 h-5" />,
    href: '/admin/users',
    badge: '2.1k'
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/admin/analytics',
    subItems: [
      {
        id: 'analytics-overview',
        label: 'Overview',
        icon: <BarChart3 className="w-4 h-4" />,
        href: '/admin/analytics/overview'
      },
      {
        id: 'analytics-engagement',
        label: 'User Engagement',
        icon: <Activity className="w-4 h-4" />,
        href: '/admin/analytics/engagement'
      },
      {
        id: 'analytics-content',
        label: 'Content Performance',
        icon: <FileText className="w-4 h-4" />,
        href: '/admin/analytics/content'
      }
    ]
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="w-5 h-5" />,
    href: '/admin/notifications',
    badge: '5'
  },
  {
    id: 'security',
    label: 'Security & Access',
    icon: <Shield className="w-5 h-5" />,
    href: '/admin/security'
  },
  {
    id: 'settings',
    label: 'Admin Settings',
    icon: <Settings className="w-5 h-5" />,
    href: '/admin/settings'
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: <HelpCircle className="w-5 h-5" />,
    href: '/admin/help'
  }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPage,
  collapsed,
  onToggleCollapse,
  onNavigate
}) => {
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['content', 'practices']);

  const toggleExpanded = (itemId: string) => {
    if (collapsed) return; // Don't expand in collapsed mode
    
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (itemId: string) => {
    return currentPage === itemId || currentPage.startsWith(itemId);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.subItems && !collapsed) {
      toggleExpanded(item.id);
    } else if (item.href) {
      onNavigate(item.id);
    }
  };

  const renderNavigationItem = (item: NavigationItem, isSubItem: boolean = false) => {
    const active = isActive(item.id);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    return (
      <div key={item.id} className="mb-1">
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
            active
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } ${isSubItem ? 'pl-10 text-sm' : ''}`}
          title={collapsed ? item.label : undefined}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} w-full`}>
            <div className="flex items-center">
              <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {item.icon}
              </span>
              
              {!collapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </div>

            {!collapsed && (
              <div className="flex items-center space-x-2">
                {item.badge && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    active 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
                
                {hasSubItems && (
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : ''
                    } ${active ? 'text-white' : 'text-gray-400'}`}
                  />
                )}
              </div>
            )}
          </div>
        </button>

        {/* Sub Items */}
        {hasSubItems && !collapsed && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.subItems!.map(subItem => renderNavigationItem(subItem, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-gray-900 border-r border-gray-800 h-full flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo and Toggle */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">Admin Panel</h1>
                <p className="text-xs text-gray-400">Mental Wellbeing AI</p>
              </div>
            </div>
          )}
          
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${
              collapsed ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {navigationItems.map(item => renderNavigationItem(item))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {!collapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Version 1.0.0
            </p>
            <p className="text-xs text-gray-500 mt-1">
              © 2025 Mental Wellbeing AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
};