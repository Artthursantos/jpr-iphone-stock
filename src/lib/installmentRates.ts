// Taxas oficiais de parcelamento - Link de Pagamento
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

// Taxas PagSeguro por bandeira
export const PAGSEGURO_RATES = {
  VISA: {
    debito: 0.99,
    1: 3.19,
    2: 3.44,
    3: 4.17,
    4: 4.89,
    5: 5.61,
    6: 6.31,
    7: 6.82,
    8: 7.52,
    9: 8.20,
    10: 8.89,
    11: 9.56,
    12: 10.22,
    13: 11.94,
    14: 12.59,
    15: 13.24,
    16: 13.88,
    17: 14.52,
    18: 15.15,
  },
  MASTER: {
    debito: 0.99,
    1: 2.95,
    2: 3.44,
    3: 4.17,
    4: 4.89,
    5: 5.61,
    6: 6.31,
    7: 6.84,
    8: 7.54,
    9: 8.22,
    10: 8.91,
    11: 9.58,
    12: 10.24,
    13: 11.94,
    14: 12.59,
    15: 13.24,
    16: 13.88,
    17: 14.52,
    18: 15.15,
  },
  ELO: {
    debito: 1.50,
    1: 3.19,
    2: 4.43,
    3: 5.16,
    4: 5.88,
    5: 6.60,
    6: 7.30,
    7: 8.10,
    8: 8.80,
    9: 9.48,
    10: 10.17,
    11: 10.84,
    12: 11.50,
    13: 12.67,
    14: 13.32,
    15: 13.97,
    16: 14.61,
    17: 15.25,
    18: 15.88,
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

export type PaymentMethod = 'pix' | 'pagseguro' | 'link';
export type CardBrand = 'VISA' | 'MASTER' | 'ELO' | 'HIPER' | 'DEMAIS';

export const getRate = (
  installments: number,
  method: PaymentMethod,
  brand?: CardBrand
): number => {
  if (method === 'link') {
    return INSTALLMENT_RATES[installments] || 0;
  }
  
  if (method === 'pagseguro' && brand) {
    return PAGSEGURO_RATES[brand][installments as keyof typeof PAGSEGURO_RATES.VISA] || 0;
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
