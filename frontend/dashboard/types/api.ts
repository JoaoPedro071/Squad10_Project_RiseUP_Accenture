// Contrato do backend FastAPI (espelha backend/README.md).
// Substitui aos poucos os tipos antigos dos mocks (client.ts, display.ts,
// experience.ts e focus.ts), que saem quando o dashboard migrar.

export type Orientation = "landscape" | "portrait";
export type ContentOrientation = Orientation | "any";

/** Estado calculado pelo backend. Prioridade: off > paused > error > busy > standby. */
export type ScreenStatus = "busy" | "standby" | "paused" | "error" | "off";

export type Experience = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "web";
  orientation: ContentOrientation;
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

/** Erros da API: cadastro (400) ou demais (4xx). */
export type FieldErrors = Record<string, string>;
export type ApiErrorBody = { error: string } | { fieldErrors: FieldErrors };