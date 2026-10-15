type StatusBadgeProps = {
  status: "online" | "offline" | "standby";
};

const config = {
  online: { icon: "●", label: "Online", style: "text-green-400 border-green-400/50" },
  offline: { icon: "○", label: "Offline", style: "text-red-400 border-red-400/50" },
  standby: { icon: "■", label: "Tela desligada", style: "text-yellow-300 border-yellow-300/50" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { icon, label, style } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${style}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}