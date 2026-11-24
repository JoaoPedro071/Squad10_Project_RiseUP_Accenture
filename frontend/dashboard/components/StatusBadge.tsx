import { statusConfig } from "@/lib/status";
import type { ScreenStatus } from "@/types/api";

type StatusBadgeProps = {
  status: ScreenStatus;
  size?: "sm" | "md";
};

const sizes = {
  sm: "px-1.5 py-0.5 text-[clamp(0.65rem,0.8vw,1rem)]",
  md: "px-2 py-1 text-xs",
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { icon, label, style } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizes[size]} ${style}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}