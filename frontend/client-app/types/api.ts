// Contrato do backend FastAPI usado pelo player (espelha backend/README.md).
// Substitui os tipos antigos dos mocks (display.ts e experience.ts) na Etapa 3.

export type Orientation = "landscape" | "portrait";
export type ContentOrientation = Orientation | "any";

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

/** Resposta do GET /api/clients/{id}/display. Prioridade: paused > image > experience > standby. */
export type DisplayState =
  | { kind: "paused" }
  | { kind: "image"; image: Image }
  | { kind: "experience"; experience: Experience }
  | { kind: "standby"; image: Image | null };

/** Corpo do POST /api/clients/{id}/heartbeat. */
export type Heartbeat = {
  orientation: Orientation;
  resolution?: string; // ex.: "1920x1080"
};