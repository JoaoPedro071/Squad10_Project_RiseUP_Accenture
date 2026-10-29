export type FocusState = {
  clientId: string; // tela que está apresentando
  room: string;
  affectedIds: string[]; // telas que foram apagadas (estavam ligadas)
  offlineIds: string[]; // telas offline, que não puderam ser apagadas (parcial)
};