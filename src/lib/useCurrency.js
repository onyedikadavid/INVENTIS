'use client';

import { useState, useEffect } from 'react';
import { fetchSettings } from './apiClient';
import { getCurrencySymbol, formatMoney, DEFAULT_CURRENCY } from './currency';

export const useCurrency = () => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings()
      .then((settings) => {
        if (settings?.currency) setCurrency(settings.currency);
      })
      .catch((error) => console.error('Could not load business currency', error))
      .finally(() => setIsLoading(false));
  }, []);

  return {
    currency,
    symbol: getCurrencySymbol(currency),
    format: (amount) => formatMoney(amount, currency),
    isLoading,
  };
};
