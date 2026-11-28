import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

// Aviso com ícone: info, sucesso, atenção ou erro.
const variants = {
  info: { icon: Info, style: "border-accent-light/40 bg-accent/10 text-accent-soft" },
  success: {
    icon: CircleCheck,
    style: "border-status-available/40 bg-status-available/10 text-status-available",
  },
  warning: { icon: TriangleAlert, style: "border-warning/40 bg-warning/10 text-warning" },
  error: { icon: CircleAlert, style: "border-danger/40 bg-danger/10 text-danger" },
};

type NoticeProps = {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
};

export default function Notice({ variant = "info", children, className = "" }: NoticeProps) {
  const { icon: Icon, style } = variants[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${style} ${className}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}