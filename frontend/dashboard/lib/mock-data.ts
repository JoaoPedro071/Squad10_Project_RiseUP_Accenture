import type { Experience } from "@/types/experience";
import type { Client } from "@/types/client";

export const experiences: Experience[] = [
  {
    id: "exp-1",
    title: "Cibersegurança",
    description: "Demonstração de detecção de ameaças em tempo real.",
    url: "/demo?tema=ciberseguranca",
    type: "web",
    orientation: "landscape",
    active: true,
  },
  {
    id: "exp-2",
    title: "Inteligência Artificial",
    description: "Painel interativo sobre aplicações de IA generativa.",
    url: "/demo?tema=ia",
    type: "web",
    orientation: "any",
    active: true,
  },
  {
    id: "exp-3",
    title: "Logística Inteligente",
    description: "Mapa de rotas e previsão de demanda.",
    url: "/demo?tema=logistica",
    type: "web",
    orientation: "landscape",
    active: true,
  },
  {
    id: "exp-4",
    title: "Cartaz Institucional",
    description: "Imagem em retrato com a apresentação do Innovation Center.",
    url: "/demo-image.svg",
    type: "image",
    orientation: "portrait",
    active: true,
  },
  {
    id: "exp-5",
    title: "Computação Quântica (antiga)",
    description: "Experiência desativada, mantida só no catálogo.",
    url: "/demo?tema=quantica",
    type: "web",
    orientation: "any",
    active: false,
  },
];

export const clients: Client[] = [
  {
    id: "cli-1",
    name: "Monitor Entrada",
    status: "online",
    orientation: "landscape",
    currentExperienceId: "exp-1",
    displayOff: false,
  },
  {
    id: "cli-2",
    name: "TV Sala de Reunião",
    status: "online",
    orientation: "landscape",
    currentExperienceId: null,
    displayOff: true,
  },
  {
    id: "cli-3",
    name: "Tablet Recepção",
    status: "online",
    orientation: "portrait",
    currentExperienceId: "exp-4",
    displayOff: false,
  },
  {
    id: "cli-4",
    name: "Monitor Touch Central",
    status: "offline",
    orientation: "landscape",
    currentExperienceId: null,
    displayOff: false,
  },
];