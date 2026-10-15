import { clients as seedClients, experiences as seedExperiences } from "@/lib/mock-data";
import type { ExperienceInput } from "@/lib/validation";
import type { Client } from "@/types/client";
import type { DisplayState } from "@/types/display";
import type { Experience } from "@/types/experience";

type Store = { experiences: Experience[]; clients: Client[] };

const globalForStore = globalThis as unknown as { __experienceStore?: Store };

const store: Store = (globalForStore.__experienceStore ??= {
  experiences: structuredClone(seedExperiences),
  clients: structuredClone(seedClients),
});

export function listExperiences(): Experience[] {
  return [...store.experiences];
}

export function listClients(): Client[] {
  return store.clients.map((c) => ({ ...c }));
}

export function findExperience(id: string): Experience | undefined {
  return store.experiences.find((e) => e.id === id);
}

export function updateClient(
  id: string,
  patch: Partial<Pick<Client, "currentExperienceId" | "displayOff">>,
): Client | null {
  const client = store.clients.find((c) => c.id === id);
  if (!client) return null;
  Object.assign(client, patch);
  return { ...client };
}

// O que a tela daquele cliente deve mostrar agora.
export function getDisplayState(clientId: string): DisplayState | null {
  const client = store.clients.find((c) => c.id === clientId);
  if (!client) return null;
  if (client.displayOff) return { kind: "off" };
  const experience = store.experiences.find(
    (e) => e.id === client.currentExperienceId,
  );
  return experience ? { kind: "showing", experience } : { kind: "waiting" };
}

export function createExperience(input: ExperienceInput): Experience {
  const experience: Experience = {
    id: `exp-${Date.now()}`,
    title: String(input.title).trim(),
    description: String(input.description ?? "").trim(),
    url: String(input.url).trim(),
    type: input.type,
    orientation: input.orientation,
    active: true,
  };
  store.experiences.push(experience);
  return experience;
}