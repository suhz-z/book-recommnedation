"use client";

import { useState } from "react";
import type { LogsCardProps, LogEntry, LogLevel } from "@/types/user";

export function LogsCard({ logs, isLoading }: LogsCardProps) {
  const [visibleCount, setVisibleCount] = useState(15);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="animate-pulse">Loading logs...</div>
      </div>
    );
  }

  const levelColors: Record<LogLevel, string> = {
    CRITICAL: "text-red-700",
    ERROR: "text-red-600",
    WARNING: "text-yellow-600",
    INFO: "text-neutral-600",
    DEBUG: "text-blue-600",
  };

  const levelStyles: Record<LogLevel, string> = {
    CRITICAL: "bg-red-200 text-red-900 font-bold",
    ERROR: "bg-red-100 text-red-700",
    WARNING: "bg-yellow-100 text-yellow-700",
    INFO: "bg-neutral-100 text-neutral-700",
    DEBUG: "bg-blue-100 text-blue-700",
  };

  const displayedLogs = logs.slice(0, visibleCount);
  const hasMore = logs.length > visibleCount;

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Logs</h2>
        <span className="text-xs text-neutral-500">
          {displayedLogs.length} / {logs.length} entries
        </span>
      </div>

      {/* Fixed height container with custom scrollbar */}
      <div className="flex-1 overflow-y-auto font-mono text-xs h-80 mb-3 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100 hover:scrollbar-thumb-neutral-400">
        <div className="space-y-2 pr-2">
          {displayedLogs.map((log: LogEntry, idx: number) => (
            <div 
              key={idx} 
              className={`p-2 hover:bg-neutral-50 rounded transition-colors border-l-2 ${
                log.level === 'CRITICAL' || log.level === 'ERROR' 
                  ? 'border-red-400' 
                  : 'border-transparent hover:border-neutral-300'
              }`}
            >
              <div className="flex flex-wrap gap-2 items-start">
                <span className="text-neutral-400 text-[10px] shrink-0">
                  {log.timestamp}
                </span>
                <span className={`font-semibold text-[10px] px-1.5 py-0.5 rounded shrink-0 ${levelStyles[log.level]}`}>
                  {log.level}
                </span>
                <span className="text-neutral-700 break-all flex-1 text-[11px] leading-relaxed">
                  {log.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load More button */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 15)}
          className="w-full py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded border border-neutral-200 transition-colors"
        >
          Load More ({logs.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
