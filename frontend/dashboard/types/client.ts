export type Client = {
  id: string;
  name: string;
  status: "online" | "offline";
  orientation: "landscape" | "portrait";
  currentExperienceId: string | null;
  displayOff: boolean;
};