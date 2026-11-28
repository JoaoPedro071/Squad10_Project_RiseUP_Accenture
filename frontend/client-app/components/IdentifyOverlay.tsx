import GreaterThan from "./GreaterThan";

// Modo de identificação: número grande e nome da tela por cima do conteúdo.
type IdentifyOverlayProps = {
  number: number;
  name: string;
};

export default function IdentifyOverlay({ number, name }: IdentifyOverlayProps) {
  return (
    <div
      role="status"
      className="fixed inset-0 flex flex-col items-center justify-center gap-[3vmin] bg-black/85 text-center"
    >
      <span className="flex h-[50vmin] w-[50vmin] items-center justify-center rounded-[4vmin] border-[0.8vmin] border-accent bg-accent/20">
        <span className="text-[34vmin] leading-none font-bold text-white">{number}</span>
      </span>
      <span className="text-[6vmin] font-bold text-white">{name}</span>
      <span className="flex items-center gap-[1.5vmin] text-[2.5vmin] text-muted">
        <GreaterThan className="h-[3vmin] w-[3vmin]" />
        Experience Manager
      </span>
    </div>
  );
}