import { useQuery } from '@tanstack/react-query';
import type { DashboardStatus, Alert, LogEntry, MonitorStats } from '../types/user';
import type { Book, SimilarBook } from '../types/book';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Book Service
export const bookService = {
  async fetchAllBooks(page = 1, pageSize = 500): Promise<Book[]> {
    try {
      const response = await fetch(`${API_URL}/api/books?page=${page}&page_size=${pageSize}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      return data.books;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  async fetchSimilarBooks(bookId: number, limit = 12): Promise<SimilarBook[]> {
    try {
      const response = await fetch(`${API_URL}/api/books/${bookId}/similar?limit=${limit}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch similar books');
      return await response.json();
    } catch (error) {
      console.error('Error fetching similar books:', error);
      throw error;
    }
  }
};

// Dashboard Service
export const dashboardService = {
  async fetchStatus(): Promise<DashboardStatus> {
    const response = await fetch(`${API_URL}/admin/api/status`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch system status');
    return await response.json();
  },

  async fetchMonitorHealth(): Promise<MonitorStats> {
    const response = await fetch(`${API_URL}/admin/api/monitor/status`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch monitor health');
    const data = await response.json();
    return data.monitor;
  },

  async fetchAlerts(limit = 50): Promise<{ alerts: Alert[]; count: number; critical_count: number }> {
    const response = await fetch(`${API_URL}/admin/api/alerts?limit=${limit}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return await response.json();
  },

  async fetchLogs(lines = 50, level?: string): Promise<{ logs: LogEntry[]; count: number }> {
    const params = new URLSearchParams({ lines: lines.toString() });
    if (level) params.append('level', level);
    
    const response = await fetch(`${API_URL}/admin/api/logs?${params}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch logs');
    return await response.json();
  },

  async resolveAlert(alertId: number): Promise<{ message: string; alert_id: number }> {
    const response = await fetch(`${API_URL}/admin/api/alerts/${alertId}/resolve`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to resolve alert');
    return await response.json();
  }
};

// React Query Hooks - Books
export const useAllBooks = (page = 1, pageSize = 500) => {
  return useQuery({
    queryKey: ['books', page, pageSize],
    queryFn: () => bookService.fetchAllBooks(page, pageSize),
    staleTime: 10 * 60 * 1000,
  });
};

export const useSimilarBooks = (bookId: number | null, limit = 12) => {
  return useQuery({
    queryKey: ['similar-books', bookId, limit],
    queryFn: () => bookService.fetchSimilarBooks(bookId!, limit),
    enabled: !!bookId,
    staleTime: 15 * 60 * 1000,
  });
};

// React Query Hooks - Dashboard
export const useDashboardStatus = () => {
  return useQuery({
    queryKey: ['dashboard-status'],
    queryFn: dashboardService.fetchStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
  });
};

export const useMonitorHealth = () => {
  return useQuery({
    queryKey: ['monitor-health'],
    queryFn: dashboardService.fetchMonitorHealth,
    refetchInterval: 30000,
    retry: 2,
  });
};

export const useDashboardAlerts = (limit = 50) => {
  return useQuery({
    queryKey: ['dashboard-alerts', limit],
    queryFn: () => dashboardService.fetchAlerts(limit),
    refetchInterval: 30000,
    retry: 2,
  });
};

export const useDashboardLogs = (lines = 50, level?: string) => {
  return useQuery({
    queryKey: ['dashboard-logs', lines, level],
    queryFn: () => dashboardService.fetchLogs(lines, level),
    refetchInterval: 15000, // Refresh every 15 seconds
    retry: 1,
  });
};
