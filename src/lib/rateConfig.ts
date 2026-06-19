// Modelo de dados editável das taxas da Calculadora.
// A hierarquia (Tipo de Taxa > Gateway > Bandeira > Parcelas > valores) é
// guardada como um único JSON no Supabase. Este arquivo define o formato,
// constrói a configuração padrão a partir das taxas atuais (seed) e expõe
// as funções de lookup/cálculo usadas pela UI.

import {
  INSTALLMENT_RATES,
  PAGSEGURO_RATES,
  CIELO_MACHINE_RATES,
  LIQD_FINANCE_RATES,
  CIELO_LINK_RATES,
} from './installmentRates';

// keys de `rates`: 'debito' ou o número da parcela em string ('1', '2', ...)
export interface BrandConfig {
  id: string;
  name: string;
  rates: Record<string, number>;
}

export interface GatewayConfig {
  id: string;
  name: string;
  maxInstallments: number;
  brands: BrandConfig[];
}

export interface RateTypeConfig {
  id: string;
  name: string;
  isPix?: boolean;
  gateways: GatewayConfig[];
}

export interface RateConfig {
  types: RateTypeConfig[];
}

const BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTER: 'Master',
  ELO: 'Elo',
  HIPER: 'Hiper',
  DEMAIS: 'Demais',
  AMEX: 'Amex',
  HIPERCARD: 'Hipercard',
  DINERS: 'Diners',
};

type RawRates = Record<string | number, number>;

const toRates = (raw: RawRates): Record<string, number> =>
  Object.fromEntries(Object.entries(raw).map(([k, v]) => [String(k), v]));

// Gateway cujas taxas variam por bandeira (PagSeguro, Liqd, Cielo Link).
const perBrand = (
  table: Record<string, RawRates>,
  brands: string[]
): BrandConfig[] =>
  brands.map((b) => ({
    id: b,
    name: BRAND_LABELS[b] ?? b,
    rates: toRates(table[b] ?? {}),
  }));

// Gateway com taxa única (ignora bandeira): replica a mesma tabela em cada
// bandeira listada, deixando-as editáveis de forma independente.
const flat = (table: RawRates, brands: string[]): BrandConfig[] =>
  brands.map((b) => ({
    id: b,
    name: BRAND_LABELS[b] ?? b,
    rates: toRates(table),
  }));

const gw = (
  id: string,
  name: string,
  maxInstallments: number,
  brands: BrandConfig[]
): GatewayConfig => ({ id, name, maxInstallments, brands });

// Configuração padrão = espelho fiel das taxas hardcoded de hoje.
// Usada como seed na primeira carga e como fallback se o banco não responder.
export const buildDefaultRateConfig = (): RateConfig => ({
  types: [
    { id: 'pix', name: 'PIX', isPix: true, gateways: [] },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      gateways: [
        gw('pagseguro', 'PagSeguro', 18, perBrand(PAGSEGURO_RATES, ['VISA', 'MASTER', 'ELO', 'HIPER', 'DEMAIS'])),
        gw('cielo_machine', 'Cielo', 18, flat(CIELO_MACHINE_RATES, ['VISA', 'MASTER'])),
        gw('liqd_finance', 'Liqd Finance', 18, perBrand(LIQD_FINANCE_RATES, ['VISA', 'MASTER', 'ELO', 'AMEX', 'HIPERCARD'])),
      ],
    },
    {
      id: 'payment_link',
      name: 'Link de Pagamento',
      gateways: [
        gw('link', 'Mercado Pago', 12, flat(INSTALLMENT_RATES, ['VISA', 'MASTER', 'ELO', 'HIPER', 'DEMAIS'])),
        gw('cielo_link', 'Cielo (Link)', 12, perBrand(CIELO_LINK_RATES, ['VISA', 'MASTER', 'ELO', 'AMEX', 'DINERS'])),
      ],
    },
  ],
});

// ── Lookups usados pela UI ────────────────────────────────────────────────

export const findType = (config: RateConfig, typeId: string) =>
  config.types.find((t) => t.id === typeId);

export const findGateway = (config: RateConfig, typeId: string, gatewayId: string) =>
  findType(config, typeId)?.gateways.find((g) => g.id === gatewayId);

export const findBrand = (
  config: RateConfig,
  typeId: string,
  gatewayId: string,
  brandId: string
) => findGateway(config, typeId, gatewayId)?.brands.find((b) => b.id === brandId);

export const getRateFromConfig = (
  config: RateConfig,
  typeId: string,
  gatewayId: string,
  brandId: string,
  installment: number | 'debito'
): number => {
  const type = findType(config, typeId);
  if (!type || type.isPix) return 0;
  const brand = findBrand(config, typeId, gatewayId, brandId);
  return brand?.rates[String(installment)] ?? 0;
};

// Cálculo: divide por (1 - taxa) para que o líquido recebido seja o baseValue.
export const calcInstallmentFromRate = (
  baseValue: number,
  installments: number,
  rate: number
) => {
  const finalValue = rate > 0 ? baseValue / (1 - rate / 100) : baseValue;
  const installmentValue = installments > 0 ? finalValue / installments : finalValue;
  return { finalValue, installmentValue, rate };
};
