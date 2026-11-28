// Busca no navegador: sem acentos e sem diferenciar maiúsculas
// ("recepcao" acha "Recepção").
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

/** Algum dos textos contém a busca? Busca vazia combina com tudo. */
export function matches(query: string, ...texts: string[]): boolean {
  const wanted = normalize(query.trim());
  return texts.some((text) => normalize(text).includes(wanted));
}
