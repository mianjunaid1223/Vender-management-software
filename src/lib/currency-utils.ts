// Multi-currency support utilities

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalPlaces: 2 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimalPlaces: 2 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimalPlaces: 2 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimalPlaces: 0 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimalPlaces: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2 },
];

export function getCurrency(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }

  // Use Intl.NumberFormat for proper locale-aware formatting
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currency.symbol}${amount.toFixed(currency.decimalPlaces)}`;
  }
}

export function formatCurrencySimple(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
  
  return `${currency.symbol}${amount.toFixed(currency.decimalPlaces)}`;
}

export function parseCurrencyAmount(value: string): number {
  // Remove currency symbols and non-numeric characters except decimal point and minus
  const cleanValue = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string, 
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first (assuming USD as base currency)
  const usdAmount = fromCurrency === 'USD' ? amount : amount / (exchangeRates[fromCurrency] || 1);
  
  // Convert from USD to target currency
  const targetAmount = toCurrency === 'USD' ? usdAmount : usdAmount * (exchangeRates[toCurrency] || 1);
  
  return targetAmount;
}

export function getExchangeRateKey(fromCurrency: string, toCurrency: string): string {
  return `${fromCurrency}_${toCurrency}`;
}

// Mock exchange rates - in production, these would come from an API
export const MOCK_EXCHANGE_RATES: Record<string, number> = {
  'EUR': 0.85,
  'GBP': 0.73,
  'CAD': 1.35,
  'AUD': 1.50,
  'JPY': 110.0,
  'CHF': 0.92,
  'CNY': 7.20,
  'INR': 83.0,
  'SEK': 10.5,
  'NOK': 10.8,
  'DKK': 6.35,
  'PLN': 4.20,
  'CZK': 23.0,
  'HUF': 350.0,
  'BRL': 5.20,
  'MXN': 17.5,
  'ZAR': 18.5,
  'SGD': 1.35,
  'HKD': 7.80,
  'NZD': 1.65,
};

export function getCurrencySelectOptions() {
  return SUPPORTED_CURRENCIES.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    symbol: currency.symbol
  }));
}

export function validateCurrencyCode(code: string): boolean {
  return SUPPORTED_CURRENCIES.some(currency => currency.code === code);
}

export function getDefaultCurrency(): string {
  return 'USD';
}

// Currency conversion with proper rounding
export function roundToDecimalPlaces(amount: number, currencyCode: string): number {
  const currency = getCurrency(currencyCode);
  const decimalPlaces = currency?.decimalPlaces ?? 2;
  return Math.round(amount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
}
