import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskBand, ReviewStatus } from '@/lib/risk-engine';

export function RiskBadge({ band, className }: { band: RiskBand; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "uppercase font-bold tracking-wider px-2.5 py-0.5 border",
        band === "GREEN" && "risk-badge-green",
        band === "YELLOW" && "risk-badge-yellow",
        band === "RED" && "risk-badge-red",
        className
      )}
    >
      {band}
    </Badge>
  );
}

export function StatusBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "uppercase font-medium text-[10px] tracking-wide",
        status === "OK" && "bg-slate-100 text-slate-600",
        status === "DUE_SOON" && "bg-blue-100 text-blue-700",
        status === "OVERDUE" && "bg-orange-100 text-orange-700",
        className
      )}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}
