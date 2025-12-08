"use client";

import { useDashboardStatus, useDashboardAlerts, useDashboardLogs } from "@/lib/api";
import { Activity, AlertCircle, FileText } from "lucide-react";
import {
  StatusBadge,
  AlertsCard,
  LogsCard,
} from "@/components/dashboard";


export default function DashboardPage() {
  const { data: status, isLoading: statusLoading } = useDashboardStatus();
  const { data: alertsData, isLoading: alertsLoading } = useDashboardAlerts();
  const { data: logsData, isLoading: logsLoading } = useDashboardLogs(50);

  if (statusLoading) {
    return <DashboardLoader />;
  }

  if (!status) {
    return <DashboardError />;
  }

  const criticalCount = alertsData?.critical_count || 0;
  const totalAlerts = alertsData?.count || 0;

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <DashboardHeader />
        
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard
            icon={Activity}
            title="System Status"
            value={status.status === 'healthy' ? 'Operational' : 'Degraded'}
            message={status.message}
            status={status.status}
          />
          <StatusCard
            icon={AlertCircle}
            title="Active Alerts"
            value={totalAlerts.toString()}
            message={criticalCount > 0 ? `${criticalCount} critical` : 'No critical alerts'}
            status={criticalCount > 0 ? 'unhealthy' : totalAlerts > 0 ? 'warning' : 'healthy'}
          />
          <StatusCard
            icon={FileText}
            title="Recent Logs"
            value={logsData?.count.toString() || '0'}
            message="Last 50 entries"
            status="healthy"
          />
        </div>

        {/* Alerts and Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsCard alerts={alertsData?.alerts || []} isLoading={alertsLoading} />
          <LogsCard logs={logsData?.logs || []} isLoading={logsLoading} />
        </div>
      </div>
    </div>
  );
}


function DashboardHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
      <p className="text-neutral-600 mt-1">Monitor system status, alerts, and logs</p>
    </div>
  );
}


function DashboardLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4" />
        <p className="text-neutral-600">Loading dashboard...</p>
      </div>
    </div>
  );
}


function DashboardError() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-lg font-semibold">Failed to load dashboard data</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );
}


interface StatusCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  message: string;
  status: 'healthy' | 'unhealthy' | 'warning';
}

function StatusCard({ icon: Icon, title, value, message, status }: StatusCardProps) {
  const statusColors = {
    healthy: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    unhealthy: 'bg-red-50 border-red-200',
  };

  const textColors = {
    healthy: 'text-green-700',
    warning: 'text-yellow-700',
    unhealthy: 'text-red-700',
  };

  const iconColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    unhealthy: 'text-red-600',
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${statusColors[status]} transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${textColors[status]} mb-1`}>{value}</p>
          <p className="text-xs text-neutral-500">{message}</p>
        </div>
        <Icon className={`w-8 h-8 ${iconColors[status]}`} />
      </div>
    </div>
  );
}
