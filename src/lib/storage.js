import { parseCurrency, formatMoney, DEFAULT_CURRENCY } from './currency.js';

const defaultUsers = [];
const defaultProducts = [];
const defaultReports = [];
const defaultExpenses = [];
const defaultReceipts = [];
const defaultStock = [];

const clearLegacyMockData = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const legacyKeys = ['trakit_users', 'trakit_products', 'trakit_daily_reports', 'trakit_expenses', 'trakit_receipts', 'trakit_stock_control'];

  for (const key of legacyKeys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const isLegacyMockData = Array.isArray(parsed) && parsed.some((item) => {
        if (item && typeof item === 'object') {
          return item.email === 'owner@example.com' || item.email === 'salesrep@example.com' || item.name === 'James Osei' || item.name === 'John Sales' || item.name === 'Earpod';
        }
        return false;
      });

      if (isLegacyMockData) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore malformed local storage data and keep the live state clean.
    }
  }
};

clearLegacyMockData();

const fallbackStorage = globalThis.__trakitStorage ?? (globalThis.__trakitStorage = {});

const getLocalStorageValue = (key, fallbackValue) => {
  if (typeof window !== 'undefined') {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (!storedValue) {
        window.localStorage.setItem(key, JSON.stringify(fallbackValue));
        return fallbackValue;
      }

      return JSON.parse(storedValue);
    } catch {
      return fallbackValue;
    }
  }

  if (!(key in fallbackStorage)) {
    fallbackStorage[key] = fallbackValue;
  }

  return fallbackStorage[key];
};

const setLocalStorageValue = (key, value) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
    return;
  }

  fallbackStorage[key] = value;
};

const browserStorage = {
  users: {
    getAll: () => getLocalStorageValue('trakit_users', defaultUsers),
    getById: (id) => {
      const users = getLocalStorageValue('trakit_users', defaultUsers);
      return users.find((user) => user.id === id) || null;
    },
    getByEmail: (email) => {
      const users = getLocalStorageValue('trakit_users', defaultUsers);
      return users.find((user) => user.email === email) || null;
    },
    create: (user) => {
      const users = getLocalStorageValue('trakit_users', defaultUsers);
      const newUser = { ...user, id: String(Date.now()), createdAt: new Date().toISOString() };
      const nextUsers = [...users, newUser];
      setLocalStorageValue('trakit_users', nextUsers);
      return newUser;
    },
    update: (id, updates) => {
      const users = getLocalStorageValue('trakit_users', defaultUsers);
      const index = users.findIndex((user) => user.id === id);
      if (index === -1) {
        return null;
      }
      const updatedUser = { ...users[index], ...updates };
      users[index] = updatedUser;
      setLocalStorageValue('trakit_users', users);
      return updatedUser;
    },
  },

  products: {
    getAll: () => getLocalStorageValue('trakit_products', defaultProducts),
    getById: (id) => {
      const products = getLocalStorageValue('trakit_products', defaultProducts);
      return products.find((product) => product.id === id) || null;
    },
    create: (product) => {
      const products = getLocalStorageValue('trakit_products', defaultProducts);
      const newProduct = { ...product, id: String(Date.now()) };
      const nextProducts = [...products, newProduct];
      setLocalStorageValue('trakit_products', nextProducts);
      return newProduct;
    },
    update: (id, updates) => {
      const products = getLocalStorageValue('trakit_products', defaultProducts);
      const index = products.findIndex((product) => product.id === id);
      if (index === -1) {
        return null;
      }
      const updatedProduct = { ...products[index], ...updates };
      products[index] = updatedProduct;
      setLocalStorageValue('trakit_products', products);
      return updatedProduct;
    },
    delete: (id) => {
      const products = getLocalStorageValue('trakit_products', defaultProducts).filter((product) => product.id !== id);
      setLocalStorageValue('trakit_products', products);
      return true;
    },
    saveAll: (products) => {
      setLocalStorageValue('trakit_products', products);
      return true;
    },
  },

  dailyReports: {
    getAll: () => getLocalStorageValue('trakit_daily_reports', defaultReports),
    getByDate: (date) => {
      const reports = getLocalStorageValue('trakit_daily_reports', defaultReports);
      return reports.filter((report) => report.date === date);
    },
    getTodayReport: () => {
      const today = new Date().toISOString().split('T')[0];
      return browserStorage.dailyReports.getByDate(today);
    },
  },

  expenses: {
    getAll: () => getLocalStorageValue('trakit_expenses', defaultExpenses),
    getById: (id) => {
      const expenses = getLocalStorageValue('trakit_expenses', defaultExpenses);
      return expenses.find((expense) => expense.id === id) || null;
    },
    create: (expense) => {
      const expenses = getLocalStorageValue('trakit_expenses', defaultExpenses);
      const newExpense = {
        ...expense,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
      };
      const nextExpenses = [...expenses, newExpense];
      setLocalStorageValue('trakit_expenses', nextExpenses);
      return newExpense;
    },
    update: (id, updates) => {
      const expenses = getLocalStorageValue('trakit_expenses', defaultExpenses);
      const index = expenses.findIndex((expense) => expense.id === id);
      if (index === -1) {
        return null;
      }
      const updatedExpense = { ...expenses[index], ...updates };
      expenses[index] = updatedExpense;
      setLocalStorageValue('trakit_expenses', expenses);
      return updatedExpense;
    },
    delete: (id) => {
      const expenses = getLocalStorageValue('trakit_expenses', defaultExpenses).filter(
        (expense) => expense.id !== id
      );
      setLocalStorageValue('trakit_expenses', expenses);
      return true;
    },
    saveAll: (expenses) => {
      setLocalStorageValue('trakit_expenses', expenses);
      return true;
    },
  },

  eReceipts: {
    getAll: () => getLocalStorageValue('trakit_receipts', defaultReceipts),
    getById: (id) => {
      const receipts = getLocalStorageValue('trakit_receipts', defaultReceipts);
      return receipts.find((receipt) => receipt.id === id) || null;
    },
    create: (receipt) => {
      const receipts = getLocalStorageValue('trakit_receipts', defaultReceipts);
      const newReceipt = { ...receipt, id: String(Date.now()), createdAt: new Date().toISOString() };
      const nextReceipts = [...receipts, newReceipt];
      setLocalStorageValue('trakit_receipts', nextReceipts);
      return newReceipt;
    },
  },

  stockControl: {
    getAll: () => getLocalStorageValue('trakit_stock_control', defaultStock),
    create: (item) => {
      const stockItems = getLocalStorageValue('trakit_stock_control', defaultStock);
      const newItem = { ...item, id: String(Date.now()), date: new Date().toISOString() };
      const nextStock = [...stockItems, newItem];
      setLocalStorageValue('trakit_stock_control', nextStock);
      return newItem;
    },
  },
};

let serverStoragePromise = null;

const getServerStorage = () => {
  if (typeof window !== 'undefined') {
    return null;
  }

  if (!serverStoragePromise) {
    serverStoragePromise = import('./serverStorage.js')
      .then((module) => module.serverStorage)
      .catch(() => null);
  }

  return serverStoragePromise;
};

const withServerStorage = (browserHandler, serverHandler) => (...args) => {
  if (typeof window !== 'undefined') {
    return browserHandler(...args);
  }

  return getServerStorage().then((server) => {
    if (server) {
      return serverHandler(server, ...args);
    }

    return browserHandler(...args);
  });
};

export const storage = {
  users: {
    getAll: withServerStorage(
      () => browserStorage.users.getAll(),
      (server) => server.users.getAll()
    ),
    getById: withServerStorage(
      (id) => browserStorage.users.getById(id),
      (server, id) => server.users.getById(id)
    ),
    getByEmail: withServerStorage(
      (email) => browserStorage.users.getByEmail(email),
      (server, email) => server.users.getByEmail(email)
    ),
    create: withServerStorage(
      (user) => browserStorage.users.create(user),
      (server, user) => server.users.create(user)
    ),
    update: withServerStorage(
      (id, updates) => browserStorage.users.update(id, updates),
      (server, id, updates) => server.users.update(id, updates)
    ),
  },

  products: {
    getAll: withServerStorage(
      () => browserStorage.products.getAll(),
      (server) => server.products.getAll()
    ),
    getById: withServerStorage(
      (id) => browserStorage.products.getById(id),
      (server, id) => server.products.getById(id)
    ),
    create: withServerStorage(
      (product) => browserStorage.products.create(product),
      (server, product) => server.products.create(product)
    ),
    update: withServerStorage(
      (id, updates) => browserStorage.products.update(id, updates),
      (server, id, updates) => server.products.update(id, updates)
    ),
    delete: withServerStorage(
      (id) => browserStorage.products.delete(id),
      (server, id) => server.products.delete(id)
    ),
    saveAll: (products) => browserStorage.products.saveAll(products),
  },

  dailyReports: {
    getAll: withServerStorage(
      () => browserStorage.dailyReports.getAll(),
      (server) => server.dailyReports.getAll()
    ),
    getByDate: withServerStorage(
      (date) => browserStorage.dailyReports.getByDate(date),
      (server, date) => server.dailyReports.getByDate(date)
    ),
    getTodayReport: withServerStorage(
      () => browserStorage.dailyReports.getTodayReport(),
      (server) => server.dailyReports.getTodayReport()
    ),
    create: withServerStorage(
      (report) => browserStorage.dailyReports.create ? browserStorage.dailyReports.create(report) : report,
      (server, report) => server.dailyReports.create(report)
    ),
  },

  settings: {
    get: withServerStorage(
      () => ({ id: 'default', currency: 'NGN' }),
      (server) => server.settings.get()
    ),
    update: withServerStorage(
      (currency) => ({ id: 'default', currency }),
      (server, currency) => server.settings.update(currency)
    ),
  },

  dailySummary: {
    get: withServerStorage(
      (date) => ({ date, manualAdjustment: 0, notes: null, submitted: false }),
      (server, date) => server.dailySummary.get(date)
    ),
    upsert: withServerStorage(
      (date, updates) => ({ date, ...updates }),
      (server, date, updates) => server.dailySummary.upsert(date, updates)
    ),
  },

  receiptsByDate: {
    get: withServerStorage(
      () => [],
      (server, date, tzOffsetMinutes) => server.receiptsByDate.get(date, tzOffsetMinutes)
    ),
  },

  expenses: {
    getAll: withServerStorage(
      () => browserStorage.expenses.getAll(),
      (server) => server.expenses.getAll()
    ),
    getById: withServerStorage(
      (id) => browserStorage.expenses.getById(id),
      (server, id) => server.expenses.getById(id)
    ),
    create: withServerStorage(
      (expense) => browserStorage.expenses.create(expense),
      (server, expense) => server.expenses.create(expense)
    ),
    update: withServerStorage(
      (id, updates) => browserStorage.expenses.update(id, updates),
      (server, id, updates) => server.expenses.update(id, updates)
    ),
    delete: withServerStorage(
      (id) => browserStorage.expenses.delete(id),
      (server, id) => server.expenses.delete(id)
    ),
    saveAll: (expenses) => browserStorage.expenses.saveAll(expenses),
  },

  eReceipts: {
    getAll: withServerStorage(
      () => browserStorage.eReceipts.getAll(),
      (server) => server.eReceipts.getAll()
    ),
    getById: withServerStorage(
      (id) => browserStorage.eReceipts.getById(id),
      (server, id) => server.eReceipts.getById(id)
    ),
    create: withServerStorage(
      (receipt) => browserStorage.eReceipts.create(receipt),
      (server, receipt) => server.eReceipts.create(receipt)
    ),
  },

  stockControl: {
    getAll: withServerStorage(
      () => browserStorage.stockControl.getAll(),
      (server) => server.stockControl.getAll()
    ),
    create: withServerStorage(
      (item) => browserStorage.stockControl.create(item),
      (server, item) => server.stockControl.create(item)
    ),
  },
};

export const calculateDailyMetrics = ({ products = [], expenses = [], currency = DEFAULT_CURRENCY }) => {
  const totalRevenue = products.reduce((sum, product) => {
    const soldUnits = Number(product.stockSold ?? 0) || 0;
    return sum + parseCurrency(product.sellPrice) * soldUnits;
  }, 0);

  const totalCost = products.reduce((sum, product) => {
    const soldUnits = Number(product.stockSold ?? 0) || 0;
    return sum + parseCurrency(product.buyPrice) * soldUnits;
  }, 0);

  const totalExpenses = expenses.reduce((sum, expense) => {
    return sum + (Number(expense.amount) || 0);
  }, 0);

  const grossProfit = totalRevenue - totalCost - totalExpenses;

  return {
    totalRevenue: formatMoney(totalRevenue, currency),
    totalCost: formatMoney(totalCost, currency),
    totalExpenses: formatMoney(totalExpenses, currency),
    grossProfit: formatMoney(grossProfit, currency),
  };
};

// Business Capital = the cost value of everything still sitting in stock.
// Recomputed live from current inStock, so it automatically moves whenever
// stock is added (goes up) or sold (goes down) — nothing extra to track.
export const calculateCapital = (products = [], currency = DEFAULT_CURRENCY) => {
  const totalCapital = products.reduce((sum, product) => {
    const unitsInStock = Number(product.inStock ?? 0) || 0;
    return sum + parseCurrency(product.buyPrice) * unitsInStock;
  }, 0);

  return formatMoney(totalCapital, currency);
};

// Shared so every page that touches Product stock (Products, Stock Control,
// E-Receipt) agrees on what "low/medium/high" and "profit" mean.
export const getStockStatus = (inStock) => {
  const qty = Number(inStock) || 0;
  if (qty > 50) return 'high';
  if (qty >= 15) return 'medium';
  return 'low';
};

export const computeProfitLabel = (buyPrice, sellPrice, stockSold, currency = DEFAULT_CURRENCY) => {
  const buy = parseCurrency(buyPrice);
  const sell = parseCurrency(sellPrice);
  const sold = Number(stockSold) || 0;
  const net = (sell - buy) * sold;
  return formatMoney(net, currency);
};

// Finds a product already in stock by name (case-insensitive, trimmed) so
// sales/stock entries can be matched to an existing line instead of creating
// duplicates every time someone types a product name slightly differently.
export const findProductByName = (products, name) => {
  const target = String(name || '').trim().toLowerCase();
  if (!target) return null;
  return products.find((p) => String(p.name || '').trim().toLowerCase() === target) || null;
};

export const getSummaryData = () => ({
  totalRevenue: '$97.40K',
  totalExpenses: '$27.40K',
  grossProfit: '$40.10K',
  businessCapital: '$600k',
  lowStockCount: 2,
  currentDate: new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
});
