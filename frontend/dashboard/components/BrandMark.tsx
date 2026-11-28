// Logo provisório: o símbolo ">" oficial da Accenture + o nome do produto.
// O logo completo (texto preto) não aparece no fundo escuro e o guia proíbe
// alterar a arte; ele entra aqui quando vier a versão branca.
export function GreaterThan({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 1000" aria-hidden="true" className={className}>
      <polygon
        fill="#8800f9"
        points="97.5 676.1 567.9 500.9 97.5 316.9 97.5 74.2 902.5 398.4 902.5 599.9 97.5 925.8 97.5 676.1"
      />
    </svg>
  );
}

export default function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <GreaterThan />
      <span className="font-bold tracking-tight text-foreground">Experience Manager</span>
    </span>
  );
}