export type FocusState = {
  clientId: string; // tela que está apresentando
  affectedIds: string[]; // telas que foram apagadas (estavam ligadas)
  offlineIds: string[]; // telas offline, que não puderam ser apagadas (parcial)
};