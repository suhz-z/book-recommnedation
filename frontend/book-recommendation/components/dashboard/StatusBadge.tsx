import type { StatusBadgeProps, ServiceStatus, MonitorStats } from "@/types/user";

interface ExtendedStatusBadgeProps extends StatusBadgeProps {
  monitor?: MonitorStats;
}

export function StatusBadge({ status, monitor }: ExtendedStatusBadgeProps) {
  const styles: Record<ServiceStatus, string> = {
    healthy: "bg-green-100 text-green-800 border-green-200",
    unhealthy: "bg-red-100 text-red-800 border-red-200",
    degraded: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const labels: Record<ServiceStatus, string> = {
    healthy: "OPERATIONAL",
    unhealthy: "DEGRADED",
    degraded: "DEGRADED",
  };

  // Determine if monitor is healthy
  const monitorHealthy = monitor?.running && 
    (monitor.check_errors === 0 || monitor.uptime_checks / monitor.total_checks > 0.95);

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${styles[status]}`}>
        <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
        <span className="text-sm font-semibold">System: {labels[status]}</span>
      </div>
      
      {monitor && (
        <div className={`inline-flex items-center px-4 py-2 rounded-lg border ml-2 ${
          monitorHealthy 
            ? "bg-blue-100 text-blue-800 border-blue-200" 
            : "bg-orange-100 text-orange-800 border-orange-200"
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            monitor.running ? "bg-current animate-pulse" : "bg-gray-400"
          }`} />
          <span className="text-sm font-semibold">
            Monitor: {monitor.running ? "ACTIVE" : "STOPPED"}
          </span>
          {monitor.running && monitor.last_check && (
            <span className="text-xs ml-2 opacity-75">
              ({monitor.uptime_checks}/{monitor.total_checks} checks)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
