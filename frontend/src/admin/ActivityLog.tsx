import {
  Activity,
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useNotificationStore } from '../stores/notificationStore';

interface ActivityLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface ActivityStats {
  actionCounts: Array<{ action: string; count: number }>;
  entityTypeCounts: Array<{ entityType: string; count: number }>;
  adminActivity: Array<{ adminEmail: string; count: number }>;
  dailyTrend: Array<{ date: string; count: number }>;
}

export const ActivityLog: React.FC = () => {
  const { push } = useNotificationStore();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');

  // Available filter options
  const [filterOptions, setFilterOptions] = useState<{
    actions: string[];
    entityTypes: string[];
    admins: string[];
  }>({
    actions: [],
    entityTypes: [],
    admins: [],
  });

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/activity-logs/filters');
      const result = await response.json();

      if (result.success) {
        setFilterOptions(result.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  // Fetch activity logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter);
      if (adminFilter !== 'all') params.append('adminEmail', adminFilter);

      const response = await fetch(`/api/admin/activity-logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs);
        setTotal(result.data.pagination.total);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        push({
          title: 'Error',
          description: result.error || 'Failed to fetch activity logs',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      push({
        title: 'Error',
        description: 'Failed to fetch activity logs',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityTypeFilter, adminFilter, push]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/activity-logs/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Export logs as CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter);
      if (adminFilter !== 'all') params.append('adminEmail', adminFilter);

      const response = await fetch(`/api/admin/activity-logs/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      push({
        title: 'Success',
        description: 'Activity logs exported successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      push({
        title: 'Error',
        description: 'Failed to export logs',
        type: 'error',
      });
    }
  };

  // Initialize
  useEffect(() => {
    fetchFilterOptions();
    fetchStats();
  }, [fetchFilterOptions, fetchStats]);

  // Fetch logs when filters or page changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs by search term (client-side)
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.adminEmail.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.entityType.toLowerCase().includes(search) ||
      (log.entityName && log.entityName.toLowerCase().includes(search))
    );
  });

  // Get action badge color
  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return <Badge variant="default" className="bg-green-100 text-green-800">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="default" className="bg-red-100 text-red-800">DELETE</Badge>;
      case 'PUBLISH':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">PUBLISH</Badge>;
      case 'UNPUBLISH':
        return <Badge variant="outline">UNPUBLISH</Badge>;
      case 'BULK_UPDATE':
        return <Badge variant="default" className="bg-indigo-100 text-indigo-800">BULK UPDATE</Badge>;
      case 'BULK_DELETE':
        return <Badge variant="default" className="bg-red-200 text-red-900">BULK DELETE</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  // Get entity type icon
  const getEntityIcon = (entityType: string) => {
    switch (entityType.toUpperCase()) {
      case 'ASSESSMENT':
        return <AlertCircle className="h-4 w-4" />;
      case 'PRACTICE':
        return <Activity className="h-4 w-4" />;
      case 'CONTENT':
        return <FileText className="h-4 w-4" />;
      case 'USER':
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Activity Log</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track all administrative actions and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                <Activity className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Admins</p>
                  <p className="text-2xl font-bold">{stats.adminActivity.length}</p>
                </div>
                <User className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entity Types</p>
                  <p className="text-2xl font-bold">{stats.entityTypeCounts.length}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">
                    {stats.dailyTrend[stats.dailyTrend.length - 1]?.count || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {filterOptions.actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {filterOptions.admins.map((admin) => (
                  <SelectItem key={admin} value={admin}>
                    {admin}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No activity logs found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    {getEntityIcon(log.entityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getActionBadge(log.action)}
                      <Badge variant="outline" className="text-xs">
                        {log.entityType}
                      </Badge>
                      {log.entityName && (
                        <span className="text-sm font-medium truncate">
                          {log.entityName}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        <User className="h-3 w-3 inline mr-1" />
                        {log.adminEmail}
                      </div>
                      <div>
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLog;
