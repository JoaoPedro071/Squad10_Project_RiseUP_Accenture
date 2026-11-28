import { statusConfig, statusOrder } from "@/lib/status";

// Legenda dos estados (como no protótipo aprovado).
export default function StatusLegend({ className = "" }: { className?: string }) {
  return (
    <ul
      aria-label="Legenda dos estados das telas"
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted ${className}`}
    >
      {statusOrder.map((status) => {
        const { icon: Icon, label, style } = statusConfig[status];
        return (
          <li key={status} className="flex items-center gap-1.5">
            <Icon
              aria-hidden="true"
              className={`h-3.5 w-3.5 ${style.split(" ")[0]}`}
              strokeWidth={2.25}
            />
            {label}
          </li>
        );
      })}
    </ul>
  );
}