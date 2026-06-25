// Lógica pura da calculadora de Garantia Estendida (Seal Care & Shield).
// Sem React, sem efeitos colaterais: só funções tipadas, fáceis de testar.

/** Prazos permitidos da garantia, em meses. */
export type PrazoMeses = 12 | 24 | 36;

/** Prazos válidos, na ordem em que aparecem na UI. */
export const PRAZOS_VALIDOS: readonly PrazoMeses[] = [12, 24, 36] as const;

/**
 * Margens da tabela principal: de 20% até 10%, decrescendo 1 ponto percentual.
 * Geradas como (20-i)/100 para evitar erros de digitação na lista.
 */
export const MARGENS: readonly number[] = Array.from(
  { length: 11 },
  (_, i) => (20 - i) / 100,
);

/** Margens usadas na tabela rápida (colinha estática). */
export const MARGENS_RAPIDA: readonly number[] = [0.2, 0.15, 0.1] as const;

/** Rótulo de nível atribuído a margens-chave da negociação. */
export type NivelMargem = "Máximo" | "Referência" | "Mínimo" | null;

/** Resultado calculado para uma única linha (margem) da tabela principal. */
export interface GarantiaResultado {
  /** Margem aplicada (ex.: 0.15). */
  margem: number;
  /** Preço cheio da garantia, arredondado para inteiro. */
  precoGarantia: number;
  /** Valor de cada parcela em até 6x (2 casas). */
  parcela6x: number;
  /** Valor de cada parcela em até 10x (2 casas). */
  parcela10x: number;
  /** Custo equivalente por mês de cobertura (2 casas). */
  precoPorMes: number;
  /** Rótulo de nível (Máximo / Referência / Mínimo) ou null. */
  nivel: NivelMargem;
}

/** Faixa de valor da tabela rápida (estática). */
export interface FaixaValor {
  label: string;
  valorRef: number;
}

/** 12 faixas fixas usadas como referência de consulta rápida. */
export const FAIXAS_VALOR: readonly FaixaValor[] = [
  { label: "Até R$ 2.000", valorRef: 1500 },
  { label: "R$ 2.001 - 3.000", valorRef: 2500 },
  { label: "R$ 3.001 - 4.000", valorRef: 3500 },
  { label: "R$ 4.001 - 5.000", valorRef: 4500 },
  { label: "R$ 5.001 - 6.000", valorRef: 5500 },
  { label: "R$ 6.001 - 7.000", valorRef: 6500 },
  { label: "R$ 7.001 - 8.000", valorRef: 7500 },
  { label: "R$ 8.001 - 9.000", valorRef: 8500 },
  { label: "R$ 9.001 - 10.000", valorRef: 9500 },
  { label: "R$ 10.001 - 12.000", valorRef: 11000 },
  { label: "R$ 12.001 - 15.000", valorRef: 13500 },
  { label: "Acima de R$ 15.000", valorRef: 18000 },
] as const;

/** Arredonda `value` para `casas` casas decimais (0 = inteiro). */
function round(value: number, casas = 0): number {
  const fator = 10 ** casas;
  return Math.round(value * fator) / fator;
}

/** Verdadeiro se `prazo` é um dos prazos permitidos (type guard). */
export function isPrazoValido(prazo: number): prazo is PrazoMeses {
  return prazo === 12 || prazo === 24 || prazo === 36;
}

/** Verdadeiro se `valor` é um número finito maior que zero. */
export function isValorValido(valor: number): boolean {
  return Number.isFinite(valor) && valor > 0;
}

/**
 * Núcleo do cálculo. Preço proporcional ao prazo:
 * 12m = base, 24m = 2x, 36m = 3x. Resultado arredondado para inteiro.
 */
export function calcularPreco(
  valor: number,
  margem: number,
  prazo: number,
): number {
  return round(valor * margem * (prazo / 12));
}

/** Mapeia uma margem-chave ao seu rótulo de nível de negociação. */
export function nivelDaMargem(margem: number): NivelMargem {
  const pontos = Math.round(margem * 100);
  if (pontos === 20) return "Máximo";
  if (pontos === 15) return "Referência";
  if (pontos === 10) return "Mínimo";
  return null;
}

/** Calcula a linha completa (preço + parcelas + nível) de uma margem. */
export function calcularLinha(
  valor: number,
  margem: number,
  prazo: PrazoMeses,
): GarantiaResultado {
  const precoGarantia = calcularPreco(valor, margem, prazo);
  return {
    margem,
    precoGarantia,
    parcela6x: round(precoGarantia / 6, 2),
    parcela10x: round(precoGarantia / 10, 2),
    precoPorMes: round(precoGarantia / prazo, 2),
    nivel: nivelDaMargem(margem),
  };
}

/** Gera a tabela principal (uma linha por margem) para os inputs dados. */
export function calcularTabela(
  valor: number,
  prazo: PrazoMeses,
): GarantiaResultado[] {
  return MARGENS.map((margem) => calcularLinha(valor, margem, prazo));
}

/** Formata número como moeda brasileira (R$ 1.234,56). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata uma margem decimal como percentual inteiro (0.15 -> "15%"). */
export function formatPercent(margem: number): string {
  return `${Math.round(margem * 100)}%`;
}
