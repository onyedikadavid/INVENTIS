// Single source of truth for supported currencies. The business picks one
// at setup (Owner-only); everything else formats against whatever is
// currently selected instead of a hardcoded symbol.
export const CURRENCIES = {
  NGN: { code: 'NGN', symbol: '\u20A6', label: 'Naira' },
  USD: { code: 'USD', symbol: '$', label: 'Dollar' },
};

export const DEFAULT_CURRENCY = 'NGN';

export const getCurrencySymbol = (code) => CURRENCIES[code]?.symbol || CURRENCIES[DEFAULT_CURRENCY].symbol;

// Strips whatever currency symbol/commas/spaces are on a value and returns
// the raw number. Symbol-agnostic on purpose — old records saved with "$"
// still parse correctly even after the business switches to Naira.
export const parseCurrency = (value) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 0;

  // Keep digits, a decimal point, a leading minus, and k/m suffix letters;
  // drop everything else (₦, $, £, €, commas, spaces...).
  const stripped = raw.replace(/[^0-9a-z.\-]/g, '');
  if (!stripped) return 0;

  const multiplierMap = { k: 1000, m: 1000000 };
  const unit = stripped.slice(-1);
  const multiplier = multiplierMap[unit] || 1;
  const numeric = Number.parseFloat(multiplier !== 1 ? stripped.slice(0, -1) : stripped) || 0;

  return numeric * multiplier;
};

export const formatMoney = (value, currencyCode = DEFAULT_CURRENCY) => {
  const numeric = Number(value) || 0;
  const symbol = getCurrencySymbol(currencyCode);
  const sign = numeric < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(numeric).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};
