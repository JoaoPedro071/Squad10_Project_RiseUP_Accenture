export type Client = {
  id: string;
  name: string;
  room: string;
  status: "online" | "offline";
  orientation: "landscape" | "portrait";
  currentExperienceId: string | null;
  displayOff: boolean;
  x: number; // posição na planta, em % da largura (0 a 100)
  y: number; // posição na planta, em % da altura (0 a 100)
  locked: boolean; // true = posição travada (não pode ser movida)
};