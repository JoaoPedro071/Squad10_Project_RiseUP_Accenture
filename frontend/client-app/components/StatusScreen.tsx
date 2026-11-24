// Tela de aviso do player (sem elementos interativos e sem cursor).
type StatusScreenProps = {
  title: string;
  detail?: string;
};

export default function StatusScreen({ title, detail }: StatusScreenProps) {
  return (
    <main className="flex h-screen cursor-none flex-col items-center justify-center gap-4 bg-black p-8 text-center">
      <span
        aria-hidden="true"
        className="h-4 w-4 rounded-full bg-accent motion-safe:animate-pulse"
      />
      <p className="text-2xl text-foreground/70">{title}</p>
      {detail && <p className="text-sm text-foreground/50">{detail}</p>}
    </main>
  );
}