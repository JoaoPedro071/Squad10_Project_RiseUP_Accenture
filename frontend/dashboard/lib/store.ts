import {
  clients as seedClients,
  experiences as seedExperiences,
} from "@/lib/mock-data";
import type { ExperienceInput } from "@/lib/validation";
import type { Client } from "@/types/client";
import type { DisplayState } from "@/types/display";
import type { Experience } from "@/types/experience";
import { planFocus } from "@/lib/focus";
import type { FocusState } from "@/types/focus";

type Store = {
  experiences: Experience[];
  clients: Client[];
  focus: FocusState | null;
};

const globalForStore = globalThis as unknown as { __experienceStore?: Store };

const store: Store = (globalForStore.__experienceStore ??= {
  experiences: structuredClone(seedExperiences),
  clients: structuredClone(seedClients),
  focus: null,
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
  patch: Partial<
    Pick<Client, "currentExperienceId" | "displayOff" | "x" | "y" | "locked">
  >,
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

export function getFocus(): FocusState | null {
  return store.focus ?? null;
}

export function startFocus(
  clientId: string,
): FocusState | "not_found" | "offline" | "already_active" {
  if (store.focus) return "already_active";

  const plan = planFocus(store.clients, clientId);
  if (!plan) return "not_found";
  if (plan.focused.status === "offline") return "offline";

  // Só apaga as que estavam ligadas; as já desligadas continuam como estão.
  plan.toDarken.forEach((c) => {
    c.displayOff = true;
  });

  store.focus = {
    clientId,
    affectedIds: plan.toDarken.map((c) => c.id),
    offlineIds: plan.offline.map((c) => c.id),
  };
  return store.focus;
}

export function endFocus(): boolean {
  if (!store.focus) return false;
  for (const id of store.focus.affectedIds) {
    const client = store.clients.find((c) => c.id === id);
    if (client) client.displayOff = false;
  }
  store.focus = null;
  return true;
}
