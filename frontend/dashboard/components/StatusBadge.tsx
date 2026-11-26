import { statusConfig } from "@/lib/status";
import type { ScreenStatus } from "@/types/api";

type StatusBadgeProps = {
  status: ScreenStatus;
  size?: "sm" | "md";
};

const sizes = {
  sm: { box: "gap-1 px-1.5 py-0.5 text-[clamp(0.65rem,0.8vw,1rem)]", icon: "h-3 w-3" },
  md: { box: "gap-1.5 px-2 py-1 text-xs", icon: "h-3.5 w-3.5" },
};

// Selo de estado: ícone + texto + cor (a cor nunca aparece sozinha).
export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { icon: Icon, label, style } = statusConfig[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border font-bold whitespace-nowrap ${sizes[size].box} ${style}`}
    >
      <Icon aria-hidden="true" className={sizes[size].icon} strokeWidth={2.25} />
      {label}
    </span>
  );
}