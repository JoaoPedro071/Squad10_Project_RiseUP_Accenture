// Modo de identificação: número grande e nome da tela por cima do conteúdo.
type IdentifyOverlayProps = {
  number: number;
  name: string;
};

export default function IdentifyOverlay({ number, name }: IdentifyOverlayProps) {
  return (
    <div
      role="status"
      className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 text-center"
    >
      <span className="text-[40vmin] leading-none font-bold text-white">{number}</span>
      <span className="text-[6vmin] text-white/80">{name}</span>
    </div>
  );
}