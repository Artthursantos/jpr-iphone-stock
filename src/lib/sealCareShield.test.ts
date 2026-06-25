import { describe, it, expect } from "vitest";
import {
  calcularPreco,
  calcularLinha,
  calcularTabela,
  nivelDaMargem,
  isPrazoValido,
  isValorValido,
  MARGENS,
  FAIXAS_VALOR,
} from "./sealCareShield";

describe("calcularPreco — cálculo base", () => {
  it("aplica preco = valor * margem * (prazo/12) para 12 meses", () => {
    // 3000 * 0.15 * (12/12) = 450
    expect(calcularPreco(3000, 0.15, 12)).toBe(450);
  });

  it("usa a margem de referência (15%) corretamente", () => {
    // 1000 * 0.15 * 1 = 150
    expect(calcularPreco(1000, 0.15, 12)).toBe(150);
  });
});

describe("calcularPreco — proporcionalidade do prazo", () => {
  it("24m vale 2x o preço de 12m", () => {
    const base = calcularPreco(2500, 0.2, 12);
    expect(calcularPreco(2500, 0.2, 24)).toBe(base * 2);
  });

  it("36m vale 3x o preço de 12m", () => {
    const base = calcularPreco(2500, 0.2, 12);
    expect(calcularPreco(2500, 0.2, 36)).toBe(base * 3);
  });
});

describe("calcularPreco — arredondamento", () => {
  it("arredonda o preço da garantia para inteiro", () => {
    // 1999 * 0.13 * 1 = 259.87 -> 260
    expect(calcularPreco(1999, 0.13, 12)).toBe(260);
    // 1999 * 0.11 * 1 = 219.89 -> 220
    expect(calcularPreco(1999, 0.11, 12)).toBe(220);
  });

  it("arredonda parcelas e preço por mês para 2 casas", () => {
    // preco = 2500 * 0.16 * 1 = 400
    const linha = calcularLinha(2500, 0.16, 12);
    expect(linha.precoGarantia).toBe(400);
    expect(linha.parcela6x).toBe(66.67); // 400/6 = 66.666...
    expect(linha.parcela10x).toBe(40); // 400/10
    expect(linha.precoPorMes).toBe(33.33); // 400/12 = 33.333...
  });
});

describe("nivelDaMargem", () => {
  it("rotula as margens-chave e ignora as demais", () => {
    expect(nivelDaMargem(0.2)).toBe("Máximo");
    expect(nivelDaMargem(0.15)).toBe("Referência");
    expect(nivelDaMargem(0.1)).toBe("Mínimo");
    expect(nivelDaMargem(0.17)).toBeNull();
  });
});

describe("calcularTabela", () => {
  it("gera 11 linhas, de 20% a 10%", () => {
    const tabela = calcularTabela(3000, 24);
    expect(tabela).toHaveLength(MARGENS.length);
    expect(tabela[0].margem).toBe(0.2);
    expect(tabela[tabela.length - 1].margem).toBe(0.1);
  });
});

describe("validações", () => {
  it("isPrazoValido só aceita 12, 24 e 36", () => {
    expect(isPrazoValido(12)).toBe(true);
    expect(isPrazoValido(24)).toBe(true);
    expect(isPrazoValido(36)).toBe(true);
    expect(isPrazoValido(18)).toBe(false);
    expect(isPrazoValido(0)).toBe(false);
  });

  it("isValorValido exige número finito > 0", () => {
    expect(isValorValido(1500)).toBe(true);
    expect(isValorValido(0)).toBe(false);
    expect(isValorValido(-100)).toBe(false);
    expect(isValorValido(Number.NaN)).toBe(false);
  });
});

// Valores conferidos célula a célula contra a planilha de origem
// ("Seal Care - Garantia e Seguros - Calculadora GE"). Travam a paridade
// app <-> planilha: qualquer regressão na regra quebra estes testes.
describe("paridade com a planilha — tabela principal (5197 x 12m)", () => {
  // [margem, preço, parcela6x, parcela10x, preço/mês] — cópia direta do CSV.
  const esperado: ReadonlyArray<[number, number, number, number, number]> = [
    [0.2, 1039, 173.17, 103.9, 86.58],
    [0.19, 987, 164.5, 98.7, 82.25],
    [0.18, 935, 155.83, 93.5, 77.92],
    [0.17, 883, 147.17, 88.3, 73.58],
    [0.16, 832, 138.67, 83.2, 69.33],
    [0.15, 780, 130.0, 78.0, 65.0],
    [0.14, 728, 121.33, 72.8, 60.67],
    [0.13, 676, 112.67, 67.6, 56.33],
    [0.12, 624, 104.0, 62.4, 52.0],
    [0.11, 572, 95.33, 57.2, 47.67],
    [0.1, 520, 86.67, 52.0, 43.33],
  ];

  it.each(esperado)(
    "margem %f → preço %i, 6x %f, 10x %f, mês %f",
    (margem, preco, p6, p10, mes) => {
      const linha = calcularLinha(5197, margem, 12);
      expect(linha.precoGarantia).toBe(preco);
      expect(linha.parcela6x).toBeCloseTo(p6, 2);
      expect(linha.parcela10x).toBeCloseTo(p10, 2);
      expect(linha.precoPorMes).toBeCloseTo(mes, 2);
    },
  );
});

describe("paridade com a planilha — tabela rápida (amostra de células)", () => {
  // Faixa, prazo, margem -> preço esperado (copiado do CSV).
  const casos: ReadonlyArray<[string, number, number, number]> = [
    ["Até R$ 2.000", 12, 0.2, 300],
    ["Até R$ 2.000", 36, 0.15, 675],
    ["R$ 5.001 - 6.000", 24, 0.15, 1650],
    ["R$ 10.001 - 12.000", 36, 0.15, 4950],
    ["Acima de R$ 15.000", 36, 0.2, 10800],
    ["Acima de R$ 15.000", 12, 0.1, 1800],
  ];

  it.each(casos)(
    "%s · %im · margem %f → %i",
    (label, prazo, margem, esperado) => {
      const faixa = FAIXAS_VALOR.find((f) => f.label === label);
      expect(faixa).toBeDefined();
      expect(calcularPreco(faixa!.valorRef, margem, prazo)).toBe(esperado);
    },
  );
});
