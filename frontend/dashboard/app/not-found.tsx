import { SearchX } from "lucide-react";
import Link from "next/link";
import StatePage from "@/components/StatePage";
import { ui } from "@/lib/ui";

// Endereço que não existe, ou experiência/imagem que não foi encontrada.
export default function NotFound() {
  return (
    <StatePage icon={SearchX} title="Página não encontrada">
      <p>O endereço não existe ou o item foi removido.</p>
      <Link href="/" className={ui.buttonPrimary}>
        Voltar para a planta
      </Link>
    </StatePage>
  );
}