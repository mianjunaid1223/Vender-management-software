import { formatCurrency, MOCK_EXCHANGE_RATES, getCurrency } from './currency';
import type { CurrencyConversion, FileImportCurrency } from '../types';

/**
 * Currency Conversion System for VendorVerse
 * Enforces single base currency per tenant with automatic conversion
 */

export class CurrencyConverter {
  private baseCurrency: string;
  private exchangeRates: Record<string, number>;

  constructor(baseCurrency: string, exchangeRates?: Record<string, number>) {
    this.baseCurrency = baseCurrency;
    this.exchangeRates = exchangeRates || MOCK_EXCHANGE_RATES;
  }

  /**
   * Convert amount from one currency to base currency
   */
  convertToBase(amount: number, fromCurrency: string, customRate?: number): CurrencyConversion {
    if (fromCurrency === this.baseCurrency) {
      return {
        fromCurrency,
        toCurrency: this.baseCurrency,
        exchangeRate: 1,
        originalAmount: amount,
        convertedAmount: amount,
        conversionDate: new Date().toISOString()
      };
    }

    const rate = customRate || this.getExchangeRate(fromCurrency, this.baseCurrency);
    const convertedAmount = this.roundToDecimalPlaces(amount / rate, this.baseCurrency);

    return {
      fromCurrency,
      toCurrency: this.baseCurrency,
      exchangeRate: rate,
      originalAmount: amount,
      convertedAmount,
      conversionDate: new Date().toISOString()
    };
  }

  /**
   * Convert amount from base currency to target currency
   */
  convertFromBase(amount: number, toCurrency: string, customRate?: number): CurrencyConversion {
    if (toCurrency === this.baseCurrency) {
      return {
        fromCurrency: this.baseCurrency,
        toCurrency,
        exchangeRate: 1,
        originalAmount: amount,
        convertedAmount: amount,
        conversionDate: new Date().toISOString()
      };
    }

    const rate = customRate || this.getExchangeRate(this.baseCurrency, toCurrency);
    const convertedAmount = this.roundToDecimalPlaces(amount * rate, toCurrency);

    return {
      fromCurrency: this.baseCurrency,
      toCurrency,
      exchangeRate: rate,
      originalAmount: amount,
      convertedAmount,
      conversionDate: new Date().toISOString()
    };
  }

  /**
   * Process file import with currency conversion
   */
  processFileImport(
    amounts: number[],
    fileImportCurrency: FileImportCurrency
  ): { originalAmounts: number[]; convertedAmounts: number[]; conversions: CurrencyConversion[] } {
    if (!fileImportCurrency.convertToBase || fileImportCurrency.fileCurrency === this.baseCurrency) {
      return {
        originalAmounts: amounts,
        convertedAmounts: amounts,
        conversions: []
      };
    }

    const conversions: CurrencyConversion[] = [];
    const convertedAmounts = amounts.map(amount => {
      const conversion = this.convertToBase(
        amount,
        fileImportCurrency.fileCurrency,
        fileImportCurrency.exchangeRate
      );
      conversions.push(conversion);
      return conversion.convertedAmount;
    });

    return {
      originalAmounts: amounts,
      convertedAmounts,
      conversions
    };
  }

  /**
   * Format amount in base currency
   */
  formatInBaseCurrency(amount: number): string {
    return formatCurrency(amount, this.baseCurrency);
  }

  /**
   * Get exchange rate between two currencies
   */
  private getExchangeRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1;

    // If converting to/from USD (base in mock rates)
    if (fromCurrency === 'USD') {
      return this.exchangeRates[toCurrency] || 1;
    }
    if (toCurrency === 'USD') {
      return 1 / (this.exchangeRates[fromCurrency] || 1);
    }

    // Convert through USD
    const fromUsdRate = this.exchangeRates[fromCurrency] || 1;
    const toUsdRate = this.exchangeRates[toCurrency] || 1;
    return toUsdRate / fromUsdRate;
  }

  /**
   * Round to appropriate decimal places for currency
   */
  private roundToDecimalPlaces(amount: number, currencyCode: string): number {
    const currency = getCurrency(currencyCode);
    const decimalPlaces = currency?.decimalPlaces ?? 2;
    return Math.round(amount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  /**
   * Validate currency conversion setup
   */
  validateSetup(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.baseCurrency) {
      errors.push('Base currency is required');
    }

    if (!getCurrency(this.baseCurrency)) {
      errors.push(`Unsupported base currency: ${this.baseCurrency}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Global currency converter instance
 * Should be initialized with company's base currency
 */
export let globalCurrencyConverter: CurrencyConverter | null = null;

export function initializeCurrencyConverter(baseCurrency: string, exchangeRates?: Record<string, number>) {
  globalCurrencyConverter = new CurrencyConverter(baseCurrency, exchangeRates);
  return globalCurrencyConverter;
}

export function getCurrencyConverter(): CurrencyConverter {
  if (!globalCurrencyConverter) {
    throw new Error('Currency converter not initialized. Call initializeCurrencyConverter first.');
  }
  return globalCurrencyConverter;
}

/**
 * Utility functions for common currency operations
 */
export function convertToBaseCurrency(amount: number, fromCurrency: string, baseCurrency: string): number {
  const converter = new CurrencyConverter(baseCurrency);
  return converter.convertToBase(amount, fromCurrency).convertedAmount;
}

export function formatInBaseCurrency(amount: number, baseCurrency: string): string {
  return formatCurrency(amount, baseCurrency);
}

/**
 * Batch convert multiple amounts to base currency
 */
export function batchConvertToBase(
  amounts: Array<{ amount: number; currency: string }>,
  baseCurrency: string
): Array<{ original: number; converted: number; currency: string }> {
  const converter = new CurrencyConverter(baseCurrency);
  
  return amounts.map(({ amount, currency }) => {
    const conversion = converter.convertToBase(amount, currency);
    return {
      original: amount,
      converted: conversion.convertedAmount,
      currency
    };
  });
}
