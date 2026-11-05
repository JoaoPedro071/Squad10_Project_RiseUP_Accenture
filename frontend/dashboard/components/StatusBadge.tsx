type StatusBadgeProps = {
  status: "online" | "offline" | "standby";
  size?: "sm" | "md";
};

const config = {
  online: { icon: "●", label: "Online", style: "text-green-400 border-green-400/50" },
  offline: { icon: "○", label: "Offline", style: "text-red-400 border-red-400/50" },
  standby: { icon: "■", label: "Tela desligada", style: "text-yellow-300 border-yellow-300/50" },
};

const sizes = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-1 text-xs",
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { icon, label, style } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizes[size]} ${style}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}