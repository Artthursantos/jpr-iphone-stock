import { describe, it, expect } from "vitest";
import {
  calcularEconomia,
  calcularEconomiaPct,
  montarLinha,
  montarTabelaSeguro,
  valorAnualComDesconto,
  formatPercent1,
  MODELOS_SEGURO,
  PARAMETROS_SEGURO,
} from "./sealShield";

describe("calcularEconomia / calcularEconomiaPct", () => {
  it("economia = preço de mercado - franquia", () => {
    expect(calcularEconomia(550, 180)).toBe(370);
  });

  it("economia % é fração do preço de mercado", () => {
    expect(calcularEconomiaPct(550, 180)).toBeCloseTo(0.6727, 4);
  });

  it("não divide por zero quando o preço de mercado é 0", () => {
    expect(calcularEconomiaPct(0, 100)).toBe(0);
  });
});

describe("formatPercent1", () => {
  it("formata fração com 1 casa decimal em pt-BR", () => {
    expect(formatPercent1(0.6727)).toBe("67,3%");
    expect(formatPercent1(0.6)).toBe("60,0%");
  });
});

describe("valorAnualComDesconto", () => {
  it("aplica os 5% de desconto à vista no Pix (R$ 120 -> R$ 114)", () => {
    expect(valorAnualComDesconto()).toBe(114);
  });
});

describe("montarTabelaSeguro", () => {
  it("monta uma linha por modelo com os campos derivados", () => {
    const tabela = montarTabelaSeguro();
    expect(tabela).toHaveLength(MODELOS_SEGURO.length);
    expect(tabela[0]).toMatchObject({
      modelo: "iPhone 11 / XR",
      economia: 370,
    });
  });
});

// Paridade com a planilha "Seguro de Tela": economia e economia % (1 casa)
// conferidas contra os valores exibidos no CSV de origem.
describe("paridade com a planilha — Seguro de Tela", () => {
  // [modelo, economia esperada, economia % exibida no CSV]
  const esperado: ReadonlyArray<[string, number, string]> = [
    ["iPhone 11 / XR", 370, "67,3%"],
    ["iPhone 12", 470, "62,7%"],
    ["iPhone 12 Pro / Pro Max", 550, "61,1%"],
    ["iPhone 13", 530, "62,4%"],
    ["iPhone 13 Pro", 680, "61,8%"],
    ["iPhone 14 Pro", 850, "60,7%"],
    ["iPhone 16 Pro Max", 1400, "60,9%"],
    ["iPhone 17 Pro Max", 1669, "62,5%"],
    ['MacBook Pro (16")', 3300, "60,0%"],
    ["iPad (10ª gen)", 450, "64,3%"],
    ["Apple Watch (todas)", 400, "66,7%"],
  ];

  it.each(esperado)("%s → economia %i e %s", (modeloNome, economia, pct) => {
    const modelo = MODELOS_SEGURO.find((m) => m.modelo === modeloNome);
    expect(modelo).toBeDefined();
    const linha = montarLinha(modelo!);
    expect(linha.economia).toBe(economia);
    expect(formatPercent1(linha.economiaPct)).toBe(pct);
  });

  it("parâmetros do produto conferem com a planilha", () => {
    expect(PARAMETROS_SEGURO.mensalidade).toBe(10);
    expect(PARAMETROS_SEGURO.valorAnual).toBe(120);
    expect(PARAMETROS_SEGURO.sinistrosPorVigencia).toBe(2);
  });
});
