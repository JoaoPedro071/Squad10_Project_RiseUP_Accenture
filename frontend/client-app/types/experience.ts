export type Experience = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "web" | "image";
  orientation: "landscape" | "portrait" | "any";
  active: boolean;
};