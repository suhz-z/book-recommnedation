import type { StatusBadgeProps, ServiceStatus } from "@/types/user";

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<ServiceStatus, string> = {
    healthy: "bg-green-100 text-green-800 border-green-200",
    unhealthy: "bg-red-100 text-red-800 border-red-200",
  };

  const labels: Record<ServiceStatus, string> = {
    healthy: "OPERATIONAL",
    unhealthy: "DEGRADED",
  };

  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${styles[status]}`}>
      <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
      <span className="text-sm font-semibold">System: {labels[status]}</span>
    </div>
  );
}
