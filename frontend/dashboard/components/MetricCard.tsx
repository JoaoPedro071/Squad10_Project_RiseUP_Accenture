import { ui } from "@/lib/ui";

// Número de resumo (ex.: "Telas cadastradas"). alert = destaca em vermelho
// quando o número é maior que zero (ex.: telas com erro).
type MetricCardProps = {
  label: string;
  value: number;
  alert?: boolean;
};

export default function MetricCard({ label, value, alert = false }: MetricCardProps) {
  return (
    <div className={ui.card}>
      <p
        className={`text-3xl font-bold ${
          alert && value > 0 ? "text-status-error" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
