import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { ui } from "@/lib/ui";
import StatePage from "./StatePage";

// Mostrada quando o perfil Apoio abre uma página só da Coordenação.
export default function NoPermission() {
  return (
    <StatePage icon={ShieldAlert} title="Sem permissão">
      <p>
        Esta página é da Coordenação. Com o perfil Apoio, você pode trocar o
        conteúdo das telas, usar o Modo foco e identificar as telas.
      </p>
      <Link href="/" className={ui.buttonPrimary}>
        Voltar para a planta
      </Link>
    </StatePage>
  );
}