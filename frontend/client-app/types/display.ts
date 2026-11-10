import type { Experience } from "./experience";

export type DisplayState =
  | { kind: "waiting" }
  | { kind: "showing"; experience: Experience }
  | { kind: "off" }
  | { kind: "error" };