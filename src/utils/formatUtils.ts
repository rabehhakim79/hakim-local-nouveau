import { StoreSettings } from '../types/store';

/**
 * Currency and Number formatting helper.
 * Enforces 2 decimals after comma/point (e.g. 150.00) or user configured precision.
 * Accepts either:
 *   formatMoney(amount, 'DZD', 2)
 *   OR
 *   formatMoney(amount, settings)
 */
export function formatMoney(
  amount: number | string | undefined | null,
  currencyOrSettings?: string | StoreSettings,
  decimals?: number
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  const safeNum = isNaN(num) ? 0 : num;

  let currencyStr: string | undefined = undefined;
  let targetDecimals = decimals ?? 2;

  if (currencyOrSettings) {
    if (typeof currencyOrSettings === 'string') {
      currencyStr = currencyOrSettings;
    } else if (typeof currencyOrSettings === 'object') {
      currencyStr = currencyOrSettings.currency;
      if (decimals === undefined && currencyOrSettings.currencyDecimals !== undefined) {
        targetDecimals = currencyOrSettings.currencyDecimals;
      }
    }
  }

  const formattedNumber = safeNum.toLocaleString('en-US', {
    minimumFractionDigits: targetDecimals,
    maximumFractionDigits: targetDecimals,
  });

  if (currencyStr) {
    return `${formattedNumber} ${currencyStr}`;
  }
  return formattedNumber;
}
