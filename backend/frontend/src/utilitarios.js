export function formatarPreco(valor) {
  // toFixed(2) usa ponto decimal (padrão americano); trocamos por vírgula
  // pra ficar no formato brasileiro (R$ 9,90 em vez de R$ 9.90).
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

export function normalizarTexto(texto) {
  // Usado na busca/filtro do catálogo: normalize("NFD") separa letras
  // acentuadas em "letra base + acento" (é → e + ́), e o replace remove só
  // os acentos — assim buscar "acao" encontra "Ação" sem diferenciar maiúsculas.
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
