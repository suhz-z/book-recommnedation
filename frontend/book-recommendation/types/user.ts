import { LucideIcon } from 'lucide-react';

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface UserWelcome {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    is_admin: boolean;
  };
}


// Dashboard types
export type ServiceStatus = "healthy" | "unhealthy" | "degraded";
export type AlertSeverity = 'warning' | 'critical';
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG' | 'CRITICAL';

export interface MonitorStats {
  running: boolean;
  last_check: string | null;
  total_checks: number;
  check_errors: number;
  uptime_checks: number;
}

// Update DashboardStatus to include monitor
export interface DashboardStatus {
  status: ServiceStatus;
  message: string;
  timestamp: string;
  monitor?: MonitorStats;
}



export interface Alert {
  id?: number;
  severity: AlertSeverity;
  source: string;
  message: string;
  timestamp: string;
  resolved?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  count: number;
  critical_count: number;
}

export interface LogsResponse {
  logs: LogEntry[];
  count: number;
}

// Component prop types
export interface StatusCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  message: string;
  status: ServiceStatus | 'warning';
}

export interface AlertsCardProps {
  alerts: Alert[];
  isLoading: boolean;
}

export interface LogsCardProps {
  logs: LogEntry[];
  isLoading: boolean;
}

export interface StatusBadgeProps {
  status: ServiceStatus;
}
