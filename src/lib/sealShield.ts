// Dados e lógica pura do Seal Shield (Seguro de Tela).
// A tabela é tabelada (franquia + preço de mercado por modelo); apenas a
// economia e a economia % são derivadas. Sem React, fácil de testar.

import { formatBRL } from "./sealCareShield";

export { formatBRL };

/** Parâmetros fixos do produto Seal Shield. */
export interface ParametrosSeguro {
  /** Mensalidade cobrada do cliente (R$/mês). */
  mensalidade: number;
  /** Valor anual equivalente (R$/ano). */
  valorAnual: number;
  /** Desconto à vista no anual via Pix (fração, ex.: 0.05). */
  descontoAnualPix: number;
  /** Máximo de acionamentos por vigência de 12 meses. */
  sinistrosPorVigencia: number;
}

export const PARAMETROS_SEGURO: ParametrosSeguro = {
  mensalidade: 10,
  valorAnual: 120,
  descontoAnualPix: 0.05,
  sinistrosPorVigencia: 2,
};

/** Linha tabelada do seguro: dados de entrada por modelo de aparelho. */
export interface ModeloSeguro {
  modelo: string;
  tipoTela: string;
  /** Franquia = custo da peça (fornecedor Seal) que o cliente paga no sinistro. */
  franquia: number;
  /** Preço que o mercado cobraria pelo mesmo reparo. */
  precoMercado: number;
}

/** Linha já com os valores derivados (economia e %), pronta para exibir. */
export interface LinhaSeguro extends ModeloSeguro {
  /** Quanto o cliente economiza no sinistro (mercado - franquia). */
  economia: number;
  /** Economia como fração do preço de mercado (ex.: 0.673). */
  economiaPct: number;
}

/**
 * Tabela de franquias por modelo. Valores conforme planilha
 * "Seal Care - Garantia e Seguros — Seguro de Tela" (status: provisórios,
 * a confirmar o custo real da peça com o fornecedor).
 */
export const MODELOS_SEGURO: readonly ModeloSeguro[] = [
  { modelo: "iPhone 11 / XR", tipoTela: "LCD", franquia: 180, precoMercado: 550 },
  { modelo: "iPhone 12", tipoTela: "OLED", franquia: 280, precoMercado: 750 },
  { modelo: "iPhone 12 Pro / Pro Max", tipoTela: "OLED", franquia: 350, precoMercado: 900 },
  { modelo: "iPhone 13", tipoTela: "OLED", franquia: 320, precoMercado: 850 },
  { modelo: "iPhone 13 Pro", tipoTela: "OLED", franquia: 420, precoMercado: 1100 },
  { modelo: "iPhone 13 Pro Max", tipoTela: "OLED", franquia: 500, precoMercado: 1300 },
  { modelo: "iPhone 14", tipoTela: "OLED", franquia: 380, precoMercado: 1000 },
  { modelo: "iPhone 14 Pro", tipoTela: "OLED", franquia: 550, precoMercado: 1400 },
  { modelo: "iPhone 14 Pro Max", tipoTela: "OLED", franquia: 650, precoMercado: 1700 },
  { modelo: "iPhone 15", tipoTela: "OLED", franquia: 420, precoMercado: 1100 },
  { modelo: "iPhone 15 Pro", tipoTela: "OLED", franquia: 600, precoMercado: 1500 },
  { modelo: "iPhone 15 Pro Max", tipoTela: "OLED", franquia: 750, precoMercado: 1900 },
  { modelo: "iPhone 16", tipoTela: "OLED", franquia: 480, precoMercado: 1200 },
  { modelo: "iPhone 16 Pro", tipoTela: "OLED", franquia: 700, precoMercado: 1800 },
  { modelo: "iPhone 16 Pro Max", tipoTela: "OLED", franquia: 900, precoMercado: 2300 },
  { modelo: "iPhone 17 Pro", tipoTela: "OLED", franquia: 850, precoMercado: 2200 },
  { modelo: "iPhone 17 Pro Max", tipoTela: "OLED", franquia: 1000, precoMercado: 2669 },
  { modelo: 'MacBook Air (13")', tipoTela: "Retina", franquia: 1200, precoMercado: 3000 },
  { modelo: 'MacBook Pro (14")', tipoTela: "Liquid Retina XDR", franquia: 1800, precoMercado: 4500 },
  { modelo: 'MacBook Pro (16")', tipoTela: "Liquid Retina XDR", franquia: 2200, precoMercado: 5500 },
  { modelo: "iPad (10ª gen)", tipoTela: "LCD", franquia: 250, precoMercado: 700 },
  { modelo: "iPad Air", tipoTela: "Liquid Retina", franquia: 400, precoMercado: 1000 },
  { modelo: 'iPad Pro 11"', tipoTela: "Liquid Retina XDR", franquia: 700, precoMercado: 1800 },
  { modelo: 'iPad Pro 13"', tipoTela: "Tandem OLED", franquia: 1100, precoMercado: 2800 },
  { modelo: "Apple Watch (todas)", tipoTela: "OLED", franquia: 200, precoMercado: 600 },
] as const;

/** Economia do cliente no sinistro: preço de mercado menos a franquia. */
export function calcularEconomia(precoMercado: number, franquia: number): number {
  return precoMercado - franquia;
}

/** Economia como fração do preço de mercado (0 se preço de mercado <= 0). */
export function calcularEconomiaPct(precoMercado: number, franquia: number): number {
  if (precoMercado <= 0) return 0;
  return calcularEconomia(precoMercado, franquia) / precoMercado;
}

/** Deriva economia e % de um modelo tabelado. */
export function montarLinha(modelo: ModeloSeguro): LinhaSeguro {
  return {
    ...modelo,
    economia: calcularEconomia(modelo.precoMercado, modelo.franquia),
    economiaPct: calcularEconomiaPct(modelo.precoMercado, modelo.franquia),
  };
}

/** Tabela completa, já com os valores derivados. */
export function montarTabelaSeguro(): LinhaSeguro[] {
  return MODELOS_SEGURO.map(montarLinha);
}

/** Valor anual à vista no Pix, já com o desconto aplicado. */
export function valorAnualComDesconto(p: ParametrosSeguro = PARAMETROS_SEGURO): number {
  return p.valorAnual * (1 - p.descontoAnualPix);
}

/** Formata uma fração como percentual com 1 casa decimal (0.673 -> "67,3%"). */
export function formatPercent1(fracao: number): string {
  return `${(fracao * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/** Item de regra/condição do seguro. */
export interface RegraSeguro {
  titulo: string;
  descricao: string;
}

/** Regras e condições do Seal Shield (texto da planilha). */
export const REGRAS_SEGURO: readonly RegraSeguro[] = [
  { titulo: "Preço", descricao: "R$ 10/mês cobrado via recorrência (cartão) ou R$ 120/ano à vista (Pix com 5% desc = R$ 114)." },
  { titulo: "Cobertura", descricao: "Quebra acidental de tela/display por impacto (queda, pressão). Inclui vidro, LCD/OLED e touch." },
  { titulo: "Sinistros", descricao: "Até 2 acionamentos por vigência de 12 meses." },
  { titulo: "Franquia", descricao: "Valor fixo = custo da peça conforme tabela. O cliente paga APENAS o custo da peça no ato do reparo. Mão de obra inclusa." },
  { titulo: "Vigência", descricao: "12 meses a partir da contratação (renovação automática). Independe da garantia do fabricante." },
  { titulo: "Carência", descricao: "15 dias se contratado no ato da compra. 30 dias se contratado depois (exige fotos do aparelho)." },
  { titulo: "Exclusões", descricao: "Danos por líquido, queimaduras, telas já danificadas na contratação, modificações não autorizadas, furto/roubo." },
  { titulo: "Prazo de reparo", descricao: "Até 5 dias úteis para iPhones/Watch. Até 10 dias úteis para MacBooks/iPads." },
  { titulo: "Pagamento da franquia", descricao: "Pix ou cartão (à vista) no momento do acionamento." },
  { titulo: "Transferência", descricao: "Vinculado ao IMEI/serial. Transferível com taxa de R$ 49,90." },
  { titulo: "Cancelamento", descricao: "Cancela a qualquer momento. Se não houve acionamento, reembolso proporcional dos meses restantes." },
  { titulo: "Acionamento", descricao: "Cliente apresenta o aparelho na loja + fotos do dano + comprovante de adesão ao plano." },
  { titulo: "Renovação", descricao: "Automática após 12 meses. Contador de sinistros zera na renovação." },
  { titulo: "Venda casada", descricao: "Produto opcional. Nunca vinculado à compra do aparelho." },
] as const;

/** Linha da análise de viabilidade (uso interno). */
export interface CenarioViabilidade {
  cenario: string;
  receita: number;
  custoMO: number;
  resultado: number;
  observacao: string;
}

/** Análise de viabilidade — R$ 120/ano com até 2 sinistros (texto da planilha). */
export const VIABILIDADE_SEGURO: readonly CenarioViabilidade[] = [
  { cenario: "Cliente NÃO aciona (0 sinistros)", receita: 120, custoMO: 0, resultado: 120, observacao: "Receita pura. Cenário mais provável (~80-85% dos clientes)." },
  { cenario: "Cliente aciona 1x (1 sinistro)", receita: 120, custoMO: 100, resultado: 20, observacao: "MO = custo interno. Peça paga pelo cliente (franquia)." },
  { cenario: "Cliente aciona 2x (2 sinistros)", receita: 120, custoMO: 200, resultado: -80, observacao: "MO 2x. Pior cenário. Ainda viável se sinistralidade baixa." },
] as const;

export const VIABILIDADE_PONTO_CHAVE =
  "A receita do Seal Shield é a taxa mensal de R$ 10. O custo da peça é repassado ao cliente (franquia). O único custo real da Seal é a mão de obra do técnico. Se ~15% dos clientes acionam, e o custo de MO é ~R$ 100 por reparo, o produto é altamente rentável: R$ 120 receita - (0,15 × R$ 100) = R$ 105 de margem por cliente/ano.";
