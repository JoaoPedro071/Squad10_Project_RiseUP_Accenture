// Contrato do backend FastAPI (espelha backend/README.md).
// Substitui aos poucos os tipos antigos dos mocks (client.ts, display.ts,
// experience.ts e focus.ts), que saem quando o dashboard migrar.

export type Orientation = "landscape" | "portrait";
export type ContentOrientation = Orientation | "any";

/** Estado calculado pelo backend. Prioridade: off > paused > error > busy > standby. */
export type ScreenStatus = "busy" | "standby" | "paused" | "error" | "off";

/** Setores (lista fechada). Rótulos em lib/sectors.ts. */
export type ExperienceSector = "finance" | "retail" | "emerging_tech" | "other";

export type Experience = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "web";
  orientation: ContentOrientation;
  sectors: ExperienceSector[]; // ao menos um
  tags: string[]; // livres, até 5
  active: boolean;
};

export type Image = {
  id: string;
  title: string;
  description: string;
  url: string;
  orientation: ContentOrientation;
  active: boolean;
};

export type Client = {
  id: string;
  name: string;
  status: ScreenStatus;
  orientationMismatch: boolean;
  currentExperienceId: string | null;
  imgId: string | null;
  displayImg: boolean; // true = exibe a imagem no lugar da experiência
  reportedOrientation: Orientation | null; // informada pela própria tela
  reportedResolution: string | null; // ex.: "1920x1080"
  lastSeenAt: string | null; // ISO 8601
  x: number; // posição na planta, em % da largura (0 a 100)
  y: number; // posição na planta, em % da altura (0 a 100)
  locked: boolean; // true = posição travada
};

/** Só os campos enviados mudam; null remove. */
export type ContentUpdate = {
  experienceId?: string | null;
  imgId?: string | null;
  displayImg?: boolean;
};

export type FocusState = { clientId: string };
export type FocusResponse = { focus: FocusState | null; clients: Client[] };

export type Settings = { standbyImageId: string | null };

/** Perfis: Coordenação pode tudo; Apoio opera as telas (sem catálogo, configurações e posições). */
export type UserRole = "coordination" | "support";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
};

/** Mensagens que o backend envia pelo WebSocket do dashboard. */
export type DashboardMessage =
  | { type: "state"; focus: FocusState | null; clients: Client[] }
  | { type: "ack"; clientId: string; version: number } // a tela confirmou a mudança
  | { type: "identify"; numbers: Record<string, number>; seconds: number };

/** Erros da API: cadastro (400) ou demais (4xx). */
export type FieldErrors = Record<string, string>;
export type ApiErrorBody = { error: string } | { fieldErrors: FieldErrors };