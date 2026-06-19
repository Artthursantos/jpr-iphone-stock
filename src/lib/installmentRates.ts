// Taxas oficiais de parcelamento - Mercado Pago (antigo Link de Pagamento)
export const INSTALLMENT_RATES: Record<number | string, number> = {
  debito: 1.05,
  1: 3.1,
  2: 4.7,
  3: 5.55,
  4: 6.4,
  5: 7.25,
  6: 8.1,
  7: 8.54,
  8: 9.39,
  9: 10.24,
  10: 11.09,
  11: 11.94,
  12: 12.79,
  13: 13.94,
  14: 14.79,
  15: 15.64,
  16: 16.49,
  17: 17.34,
  18: 18.19,
};

// Taxas PagSeguro/PagBank por bandeira (D0 — atualizadas em 2026-06-19, Rede Navecell)
// HIPER e DEMAIS não constam no comunicado mais recente; mantidos valores anteriores.
export const PAGSEGURO_RATES: Record<string, Record<number | string, number>> = {
  VISA: {
    debito: 0.99,
    1: 3.19,
    2: 5.20,
    3: 5.20,
    4: 7.20,
    5: 8.20,
    6: 7.20,
    7: 6.51,
    8: 6.51,
    9: 6.51,
    10: 7.51,
    11: 8.51,
    12: 9.51,
    13: 11.56,
    14: 12.06,
    15: 13.06,
    16: 16.06,
    17: 17.06,
    18: 17.06,
  },
  MASTER: {
    debito: 0.99,
    1: 2.95,
    2: 5.20,
    3: 5.20,
    4: 7.20,
    5: 8.20,
    6: 7.20,
    7: 6.53,
    8: 6.53,
    9: 6.53,
    10: 7.53,
    11: 8.53,
    12: 9.53,
    13: 11.56,
    14: 12.06,
    15: 13.06,
    16: 16.06,
    17: 17.06,
    18: 17.06,
  },
  ELO: {
    debito: 1.50,
    1: 3.19,
    2: 6.19,
    3: 6.19,
    4: 8.19,
    5: 9.19,
    6: 8.19,
    7: 7.49,
    8: 7.49,
    9: 7.49,
    10: 8.49,
    11: 9.49,
    12: 10.49,
    13: 12.49,
    14: 12.99,
    15: 13.99,
    16: 16.99,
    17: 17.99,
    18: 17.99,
  },
  HIPER: {
    debito: 0.00,
    1: 0.00,
    2: 2.24,
    3: 2.97,
    4: 3.69,
    5: 4.41,
    6: 5.11,
    7: 5.81,
    8: 6.51,
    9: 7.19,
    10: 7.88,
    11: 8.55,
    12: 9.21,
    13: 9.88,
    14: 10.53,
    15: 11.18,
    16: 11.82,
    17: 12.46,
    18: 13.09,
  },
  DEMAIS: {
    debito: 0.00,
    1: 4.07,
    2: 4.43,
    3: 5.16,
    4: 5.88,
    5: 6.60,
    6: 7.30,
    7: 8.20,
    8: 8.90,
    9: 9.58,
    10: 10.27,
    11: 10.94,
    12: 11.60,
    13: 12.87,
    14: 13.52,
    15: 14.17,
    16: 14.81,
    17: 15.45,
    18: 16.08,
  },
};

// Cielo máquina (Visa e Master com mesmas taxas)
export const CIELO_MACHINE_RATES: Record<number | string, number> = {
  debito: 0.89,
  1: 3.16,
  2: 4.06,
  3: 4.66,
  4: 5.24,
  5: 5.80,
  6: 6.40,
  7: 7.29,
  8: 7.81,
  9: 8.38,
  10: 8.93,
  11: 9.46,
  12: 9.97,
  13: 11.10,
  14: 11.72,
  15: 12.34,
  16: 12.96,
  17: 13.58,
  18: 14.21,
};

// Liqd Finance por bandeira
export const LIQD_FINANCE_RATES: Record<string, Record<number | string, number>> = {
  VISA: {
    debito: 2.64,
    1: 5.03,
    2: 6.44,
    3: 7.04,
    4: 7.64,
    5: 8.24,
    6: 8.84,
    7: 9.90,
    8: 10.50,
    9: 11.10,
    10: 11.70,
    11: 12.30,
    12: 12.90,
    13: 14.95,
    14: 15.55,
    15: 16.15,
    16: 16.75,
    17: 17.35,
    18: 17.95,
  },
  MASTER: {
    debito: 2.64,
    1: 5.03,
    2: 6.44,
    3: 7.04,
    4: 7.64,
    5: 8.24,
    6: 8.84,
    7: 9.90,
    8: 10.50,
    9: 11.10,
    10: 11.70,
    11: 12.30,
    12: 12.90,
    13: 14.95,
    14: 15.55,
    15: 16.15,
    16: 16.75,
    17: 17.35,
    18: 17.95,
  },
  ELO: {
    debito: 3.45,
    1: 5.64,
    2: 7.32,
    3: 7.92,
    4: 8.52,
    5: 9.12,
    6: 9.72,
    7: 10.85,
    8: 11.45,
    9: 12.05,
    10: 12.65,
    11: 13.25,
    12: 13.85,
    13: 15.45,
    14: 16.05,
    15: 16.65,
    16: 17.25,
    17: 17.85,
    18: 18.45,
  },
  AMEX: {
    debito: 0,
    1: 5.64,
    2: 7.32,
    3: 7.92,
    4: 8.52,
    5: 9.12,
    6: 9.72,
    7: 10.85,
    8: 11.45,
    9: 12.05,
    10: 12.65,
    11: 13.25,
    12: 13.85,
    13: 15.45,
    14: 16.05,
    15: 16.65,
    16: 17.25,
    17: 17.85,
    18: 18.45,
  },
  HIPERCARD: {
    debito: 0,
    1: 5.64,
    2: 7.32,
    3: 7.92,
    4: 8.52,
    5: 9.12,
    6: 9.72,
    7: 10.85,
    8: 11.45,
    9: 12.05,
    10: 12.65,
    11: 13.25,
    12: 13.85,
    13: 15.45,
    14: 16.05,
    15: 16.65,
    16: 17.25,
    17: 17.85,
    18: 18.45,
  },
};

// Cielo Link (E-commerce TC D1)
export const CIELO_LINK_RATES: Record<string, Record<number | string, number>> = {
  VISA: {
    debito: 1.14,
    1: 3.46,
    2: 5.02,
    3: 5.63,
    4: 6.26,
    5: 6.93,
    6: 7.52,
    7: 8.67,
    8: 9.61,
    9: 10.50,
    10: 10.91,
    11: 11.90,
    12: 12.81,
  },
  MASTER: {
    debito: 1.14,
    1: 3.46,
    2: 5.02,
    3: 5.63,
    4: 6.26,
    5: 6.93,
    6: 7.52,
    7: 8.67,
    8: 9.61,
    9: 10.50,
    10: 10.91,
    11: 11.90,
    12: 12.81,
  },
  ELO: {
    debito: 1.69,
    1: 4.01,
    2: 5.67,
    3: 6.28,
    4: 6.91,
    5: 7.58,
    6: 8.17,
    7: 9.32,
    8: 10.26,
    9: 11.15,
    10: 11.56,
    11: 12.55,
    12: 13.46,
  },
  AMEX: {
    debito: 0,
    1: 3.96,
    2: 5.62,
    3: 6.23,
    4: 6.86,
    5: 7.53,
    6: 8.12,
    7: 9.27,
    8: 10.21,
    9: 11.10,
    10: 11.51,
    11: 12.50,
    12: 13.41,
  },
  DINERS: {
    debito: 0,
    1: 3.46,
    2: 5.02,
    3: 5.63,
    4: 6.26,
    5: 6.93,
    6: 7.52,
    7: 8.67,
    8: 9.61,
    9: 10.50,
    10: 10.91,
    11: 11.90,
    12: 12.81,
  },
};

export type PaymentMethod =
  | 'pix'
  | 'pagseguro'
  | 'link'
  | 'cielo_machine'
  | 'liqd_finance'
  | 'cielo_link';

export type CardBrand =
  | 'VISA'
  | 'MASTER'
  | 'ELO'
  | 'HIPER'
  | 'DEMAIS'
  | 'AMEX'
  | 'HIPERCARD'
  | 'DINERS';

export const getRate = (
  installments: number,
  method: PaymentMethod,
  brand?: CardBrand
): number => {
  if (method === 'pix') {
    return 0;
  }

  if (method === 'link') {
    return INSTALLMENT_RATES[installments] || 0;
  }
  
  if (method === 'pagseguro' && brand) {
    return PAGSEGURO_RATES[brand]?.[installments] || 0;
  }

  if (method === 'cielo_machine') {
    return CIELO_MACHINE_RATES[installments] || 0;
  }

  if (method === 'liqd_finance' && brand) {
    return LIQD_FINANCE_RATES[brand]?.[installments] || 0;
  }

  if (method === 'cielo_link' && brand) {
    return CIELO_LINK_RATES[brand]?.[installments] || 0;
  }
  
  return 0;
};

export const calculateInstallment = (
  baseValue: number,
  installments: number,
  method: PaymentMethod = 'link',
  brand?: CardBrand
) => {
  const rate = getRate(installments, method, brand);
  // O cálculo correto para que você receba líquido o baseValue é dividir por (1 - taxa),
  // e não multiplicar por (1 + taxa).
  const finalValue = rate > 0 ? baseValue / (1 - rate / 100) : baseValue;
  const installmentValue = installments > 0 ? finalValue / installments : finalValue;
  
  return {
    finalValue,
    installmentValue,
    rate,
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
