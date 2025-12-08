import { AlertTriangle } from "lucide-react";
import type { AlertsCardProps, Alert, AlertSeverity } from "@/types/user";

export function AlertsCard({ alerts, isLoading }: AlertsCardProps) {
  if (isLoading) {
    return <CardSkeleton title="Active Alerts" />;
  }

  const severityStyles: Record<AlertSeverity, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Active Alerts
        </h2>
        <div className="flex items-center gap-2 text-sm">
          {criticalCount > 0 && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
              {criticalCount} Critical
            </span>
          )}
          <span className="text-neutral-500">
            {alerts.length} Total
          </span>
        </div>
      </div>
      <div className="space-y-3 h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100">
        {alerts.length === 0 ? (
          <EmptyState message="No active alerts" />
        ) : (
          alerts.map((alert: Alert, idx: number) => (
            <AlertItem key={alert.id || idx} alert={alert} severityStyles={severityStyles} />
          ))
        )}
      </div>
    </div>
  );
}

function AlertItem({ 
  alert, 
  severityStyles 
}: { 
  alert: Alert; 
  severityStyles: Record<AlertSeverity, string>;
}) {
  const isCritical = alert.severity === 'critical';
  
  return (
    <div className={`p-3 border-2 rounded hover:bg-neutral-50 transition-colors ${
      isCritical ? 'border-red-300 bg-red-50/50' : 'border-neutral-200'
    }`}>
      <div className="flex items-start gap-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded border ${severityStyles[alert.severity]}`}>
          {alert.severity.toUpperCase()}
        </span>
        <div className="flex-1">
          <p className={`text-sm font-medium ${isCritical ? 'text-red-900' : 'text-neutral-900'}`}>
            {alert.message}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {alert.source} • {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        <div className="h-4 bg-neutral-200 rounded w-5/6" />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-neutral-600 font-medium">{message}</p>
      <p className="text-neutral-400 text-xs mt-1">System is operating normally</p>
    </div>
  );
}
