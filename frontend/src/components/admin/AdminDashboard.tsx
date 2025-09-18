import { 
  Activity, 
  AlertTriangle, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Users, 
  Eye,
  Download,
  Clock,
  CheckCircle,
  Server,
  Database,
  Wifi,
  HardDrive
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'content' | 'user' | 'system' | 'practice';
  action: string;
  details: string;
  timestamp: Date;
  user?: string;
}

interface SystemHealth {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  responseTime?: string;
}

// Mock data - in real app, this would come from APIs
const mockMetrics: DashboardMetric[] = [
  {
    id: 'total-users',
    title: 'Total Users',
    value: '2,147',
    change: '+12.5%',
    trend: 'up',
    icon: <Users className="w-6 h-6" />,
    color: 'blue'
  },
  {
    id: 'active-sessions',
    title: 'Active Sessions',
    value: 342,
    change: '+8.2%',
    trend: 'up',
    icon: <Activity className="w-6 h-6" />,
    color: 'green'
  },
  {
    id: 'content-items',
    title: 'Content Items',
    value: 156,
    change: '+5',
    trend: 'up',
    icon: <FileText className="w-6 h-6" />,
    color: 'purple'
  },
  {
    id: 'practice-sessions',
    title: 'Practice Sessions Today',
    value: 89,
    change: '+15.3%',
    trend: 'up',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'orange'
  },
  {
    id: 'avg-engagement',
    title: 'Avg. Engagement Time',
    value: '24m',
    change: '+2.1%',
    trend: 'up',
    icon: <Clock className="w-6 h-6" />,
    color: 'teal'
  },
  {
    id: 'completion-rate',
    title: 'Completion Rate',
    value: '78.5%',
    change: '+4.2%',
    trend: 'up',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'indigo'
  }
];

const mockRecentActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'content',
    action: 'Content Published',
    details: 'New meditation guide "Mindful Evening Routine" published',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    user: 'Admin User'
  },
  {
    id: '2',
    type: 'user',
    action: 'User Registration',
    details: '15 new users registered in the last hour',
    timestamp: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: '3',
    type: 'practice',
    action: 'Practice Updated',
    details: 'Breathing exercise audio quality improved',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    user: 'Content Manager'
  },
  {
    id: '4',
    type: 'system',
    action: 'Backup Completed',
    details: 'Daily database backup completed successfully',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '5',
    type: 'content',
    action: 'Content Reviewed',
    details: '8 content items pending approval reviewed',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    user: 'Senior Admin'
  }
];

const mockSystemHealth: SystemHealth[] = [
  {
    component: 'API Server',
    status: 'healthy',
    uptime: '99.98%',
    responseTime: '145ms'
  },
  {
    component: 'Database',
    status: 'healthy',
    uptime: '99.95%',
    responseTime: '12ms'
  },
  {
    component: 'File Storage',
    status: 'warning',
    uptime: '98.2%',
    responseTime: '340ms'
  },
  {
    component: 'CDN',
    status: 'healthy',
    uptime: '99.99%',
    responseTime: '85ms'
  }
];

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>(mockMetrics);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(mockRecentActivities);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>(mockSystemHealth);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // In real app, refresh metrics from API
      console.log('Refreshing dashboard data...');
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getMetricColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 text-blue-100',
      green: 'bg-green-500 text-green-100',
      purple: 'bg-purple-500 text-purple-100',
      orange: 'bg-orange-500 text-orange-100',
      teal: 'bg-teal-500 text-teal-100',
      indigo: 'bg-indigo-500 text-indigo-100'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500 text-gray-100';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'content':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'user':
        return <Users className="w-4 h-4 text-green-400" />;
      case 'practice':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case 'system':
        return <Server className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSystemHealthIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <Server className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      return `${hours}h ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Welcome back! Here's what's happening with your Mental Wellbeing platform.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${getMetricColorClasses(metric.color)}`}>
                  {metric.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">{metric.title}</p>
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`flex items-center space-x-1 ${getTrendColor(metric.trend)}`}>
                  <TrendingUp className={`w-4 h-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                  <span className="text-sm font-medium">{metric.change}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs last period</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <p className="text-sm text-gray-400 mt-1">Latest actions and events</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {activity.details}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      {activity.user && (
                        <>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {activity.user}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors">
                View All Activity
              </button>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">System Health</h2>
            <p className="text-sm text-gray-400 mt-1">Monitor system components</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {systemHealth.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSystemHealthIcon(component.status)}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {component.component}
                      </p>
                      <p className="text-xs text-gray-400">
                        Uptime: {component.uptime}
                      </p>
                    </div>
                  </div>
                  {component.responseTime && (
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        {component.responseTime}
                      </p>
                      <p className="text-xs text-gray-500">response</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors">
                View System Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <FileText className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-sm font-medium text-white">Add Content</p>
            <p className="text-xs text-gray-400 mt-1">Upload new content</p>
          </button>
          <button className="p-4 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <BookOpen className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-sm font-medium text-white">Create Practice</p>
            <p className="text-xs text-gray-400 mt-1">Add new practice</p>
          </button>
          <button className="p-4 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <Users className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-sm font-medium text-white">Manage Users</p>
            <p className="text-xs text-gray-400 mt-1">View user list</p>
          </button>
          <button className="p-4 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <Activity className="w-6 h-6 text-orange-400 mb-2" />
            <p className="text-sm font-medium text-white">View Analytics</p>
            <p className="text-xs text-gray-400 mt-1">Check reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};