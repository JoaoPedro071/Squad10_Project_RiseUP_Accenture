import GreaterThan from "./GreaterThan";

// Tela de aviso do player (sem elementos interativos e sem cursor).
type StatusScreenProps = {
  title: string;
  detail?: string;
  waiting?: boolean; // conectando ou reconectando: o símbolo pulsa devagar
};

export default function StatusScreen({ title, detail, waiting = false }: StatusScreenProps) {
  return (
    <main className="flex h-screen cursor-none flex-col items-center justify-center gap-6 bg-black p-8 text-center">
      <GreaterThan
        className={`h-[12vmin] w-[12vmin] ${waiting ? "motion-safe:animate-pulse" : ""}`}
      />
      <p className="text-[4vmin] font-bold text-foreground">{title}</p>
      {detail && <p className="max-w-[70vw] text-[2.2vmin] text-muted">{detail}</p>}
    </main>
  );
}