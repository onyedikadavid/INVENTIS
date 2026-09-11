let prisma = null;

const defaultUsers = [];
const defaultProducts = [];
const defaultExpenses = [];

const mapProduct = (row) => ({
  ...row,
  inStock: Number(row.inStock),
  stockSold: Number(row.stockSold),
});

const mapReport = (row) => ({
  ...row,
  inStock: Number(row.inStock),
  stockSold: Number(row.stockSold),
});

const mapReceipt = (row) => ({
  ...row,
  items: row.items ? JSON.parse(row.items) : [],
});

const mapStockControl = (row) => ({
  ...row,
  quantity: Number(row.quantity),
  unitPrice: Number(row.unitPrice),
  totalPrice: Number(row.totalPrice),
  date: row.date instanceof Date ? row.date : new Date(row.date),
});

let fallbackUsers = [];
let fallbackProducts = [];
let fallbackReports = [];
let fallbackReceipts = [];
let fallbackStock = [];

const hasDatabaseConfig = () => Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public');

const getPrisma = async () => {
  if (!hasDatabaseConfig()) {
    return null;
  }

  if (!prisma) {
    try {
      const prismaModule = await import('./prisma.js');
      prisma = prismaModule.default;
    } catch (error) {
      console.warn('Prisma client unavailable. Database connection is not active.', error.message);
      prisma = null;
    }
  }

  return prisma;
};

const runWithFallback = async (operation, fallbackValue) => {
  if (!hasDatabaseConfig()) {
    return fallbackValue;
  }

  try {
    const currentPrisma = await getPrisma();
    if (!currentPrisma) {
      return fallbackValue;
    }

    return await operation(currentPrisma);
  } catch (error) {
    console.warn('Prisma unavailable. Returning empty fallback state.', error.message);
    return fallbackValue;
  }
};

export const serverStorage = {
  users: {
    getAll: async () => {
      return runWithFallback(
        async (currentPrisma) => {
          const results = await currentPrisma.user.findMany();
          return results.map((row) => ({ ...row, createdAt: new Date(row.createdAt) }));
        },
        []
      );
    },
    getById: async (id) => {
      return runWithFallback(
        async (currentPrisma) => {
          const row = await currentPrisma.user.findUnique({ where: { id } });
          return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
        },
        null
      );
    },
    getByEmail: async (email) => {
      return runWithFallback(
        async (currentPrisma) => {
          const row = await currentPrisma.user.findUnique({ where: { email } });
          return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
        },
        null
      );
    },
    create: async ({ name, email, passwordHash, role }) => {
      return runWithFallback(
        async (currentPrisma) => {
          const created = await currentPrisma.user.create({
            data: {
              name,
              email,
              passwordHash,
              role,
            },
          });
          return { ...created, createdAt: new Date(created.createdAt) };
        },
        null
      );
    },
    update: async (id, updates) => {
      return runWithFallback(
        async (currentPrisma) => {
          const existing = await currentPrisma.user.findUnique({ where: { id } });
          if (!existing) return null;
          const updated = await currentPrisma.user.update({
            where: { id },
            data: {
              name: updates.name ?? existing.name,
              email: updates.email ?? existing.email,
              passwordHash: updates.passwordHash ?? existing.passwordHash,
              role: updates.role ?? existing.role,
            },
          });
          return { ...updated, createdAt: new Date(updated.createdAt) };
        },
        null
      );
    },
  },

  products: {
    getAll: async () => {
      return runWithFallback(
        async (currentPrisma) => {
          const results = await currentPrisma.product.findMany();
          return results.map(mapProduct);
        },
        []
      );
    },
    getById: async (id) => {
      return runWithFallback(
        async (currentPrisma) => {
          const row = await currentPrisma.product.findUnique({ where: { id } });
          return row ? mapProduct(row) : null;
        },
        null
      );
    },
    create: async (product) => {
      return runWithFallback(
        async (currentPrisma) => {
          const created = await currentPrisma.product.create({
            data: {
              name: product.name,
              category: product.category,
              buyPrice: product.buyPrice,
              sellPrice: product.sellPrice,
              inStock: Number(product.inStock),
              stockSold: Number(product.stockSold),
              profit: product.profit,
              status: product.status,
            },
          });
          return mapProduct(created);
        },
        null
      );
    },
    update: async (id, updates) => {
      return runWithFallback(
        async (currentPrisma) => {
          const existing = await currentPrisma.product.findUnique({ where: { id } });
          if (!existing) return null;
          const updated = await currentPrisma.product.update({
            where: { id },
            data: {
              name: updates.name ?? existing.name,
              category: updates.category ?? existing.category,
              buyPrice: updates.buyPrice ?? existing.buyPrice,
              sellPrice: updates.sellPrice ?? existing.sellPrice,
              inStock: Number(updates.inStock ?? existing.inStock),
              stockSold: Number(updates.stockSold ?? existing.stockSold),
              profit: updates.profit ?? existing.profit,
              status: updates.status ?? existing.status,
            },
          });
          return mapProduct(updated);
        },
        null
      );
    },
    delete: async (id) => {
      return runWithFallback(
        async (currentPrisma) => {
          await currentPrisma.product.delete({ where: { id } });
          return true;
        },
        false
      );
    },
  },

  dailyReports: {
    getAll: async () => {
      return runWithFallback(
        async (currentPrisma) => {
          const results = await currentPrisma.dailyReport.findMany();
          return results.map(mapReport);
        },
        []
      );
    },
    getByDate: async (date) => {
      return runWithFallback(
        async (currentPrisma) => {
          const results = await currentPrisma.dailyReport.findMany({ where: { date } });
          return results.map(mapReport);
        },
        []
      );
    },
    getTodayReport: async () => {
      const today = new Date().toISOString().split('T')[0];
      return runWithFallback(
        async (currentPrisma) => {
          const results = await currentPrisma.dailyReport.findMany({ where: { date: today } });
          return results.map(mapReport);
        },
        []
      );
    },
    create: async (report) => {
      return runWithFallback(
        async (currentPrisma) => {
          const created = await currentPrisma.dailyReport.create({
            data: {
              date: report.date,
              product: report.product,
              category: report.category,
              buy: report.buy,
              sell: report.sell,
              inStock: Number(report.inStock) || 0,
              stockSold: Number(report.stockSold) || 0,
              profit: report.profit,
              status: report.status,
              addedByRole: report.addedByRole || null,
            },
          });
          return mapReport(created);
        },
        null
      );
    },
  },

  expenses: {
    getAll: async () => {
      return runWithFallback(
        async (currentPrisma) => {
          const results = await currentPrisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
          return results.map((row) => ({ ...row, createdAt: new Date(row.createdAt) }));
        },
        []
      );
    },
    getById: async (id) => {
      return runWithFallback(
        async (currentPrisma) => {
          const row = await currentPrisma.expense.findUnique({ where: { id } });
          return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
        },
        null
      );
    },
    create: async (expense) => {
      return runWithFallback(
        async (currentPrisma) => {
          const created = await currentPrisma.expense.create({
            data: {
              description: expense.description,
              category: expense.category,
              amount: Number(expense.amount || 0),
              date: expense.date,
              addedByRole: expense.addedByRole || null,
            },
          });
          return { ...created, createdAt: new Date(created.createdAt) };
        },
        null
      );
    },
    update: async (id, updates) => {
      return runWithFallback(
        async (currentPrisma) => {
          const existing = await currentPrisma.expense.findUnique({ where: { id } });
          if (!existing) return null;
          const updated = await currentPrisma.expense.update({
            where: { id },
            data: {
              description: updates.description ?? existing.description,
              category: updates.category ?? existing.category,
              amount: Number(updates.amount ?? existing.amount),
              date: updates.date ?? existing.date,
              addedByRole: updates.addedByRole ?? existing.addedByRole,
            },
          });
          return { ...updated, createdAt: new Date(updated.createdAt) };
        },
        null
      );
    },
    delete: async (id) => {
      return runWithFallback(
        async (currentPrisma) => {
          await currentPrisma.expense.delete({ where: { id } });
          return true;
        },
        false
      );
    },
  },

  eReceipts: {
    getAll: async () => {
      return runWithFallback(
        async (currentPrisma) => {
          const results = await currentPrisma.eReceipt.findMany();
          return results.map(mapReceipt);
        },
        []
      );
    },
    getById: async (id) => {
      return runWithFallback(
        async (currentPrisma) => {
          const row = await currentPrisma.eReceipt.findUnique({ where: { id } });
          return row ? mapReceipt(row) : null;
        },
        null
      );
    },
    create: async (receipt) => {
      return runWithFallback(
        async (currentPrisma) => {
          const created = await currentPrisma.eReceipt.create({
            data: {
              customerName: receipt.customerName,
              customerPhone: receipt.customerPhone,
              items: JSON.stringify(receipt.items || []),
              totalAmount: receipt.totalAmount || '',
              createdBy: receipt.createdBy,
              createdByRole: receipt.createdByRole,
            },
          });
          return mapReceipt(created);
        },
        null
      );
    },
  },

  stockControl: {
    getAll: async () => {
      return runWithFallback(
        async (currentPrisma) => {
          const results = await currentPrisma.stockControl.findMany();
          return results.map(mapStockControl);
        },
        []
      );
    },
    create: async (item) => {
      return runWithFallback(
        async (currentPrisma) => {
          const created = await currentPrisma.stockControl.create({
            data: {
              product: item.product,
              category: item.category,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
            },
          });
          return mapStockControl(created);
        },
        null
      );
    },
  },

  settings: {
    // Single-tenant app — one settings row for the whole business.
    get: async () => {
      return runWithFallback(
        async (currentPrisma) => {
          const existing = await currentPrisma.businessSettings.findUnique({ where: { id: 'default' } });
          if (existing) return existing;
          return currentPrisma.businessSettings.create({ data: { id: 'default', currency: 'NGN' } });
        },
        { id: 'default', currency: 'NGN' }
      );
    },
    update: async (currency) => {
      return runWithFallback(
        async (currentPrisma) => {
          return currentPrisma.businessSettings.upsert({
            where: { id: 'default' },
            update: { currency },
            create: { id: 'default', currency },
          });
        },
        { id: 'default', currency }
      );
    },
  },

  // Per-date manual sales adjustment + notes + submission status. Actual
  // sale totals for a date are NOT stored here — they're computed live from
  // EReceipt rows so there is exactly one place a sale is ever recorded.
  dailySummary: {
    get: async (date) => {
      return runWithFallback(
        async (currentPrisma) => {
          const existing = await currentPrisma.dailySummary.findUnique({ where: { date } });
          return existing || { date, manualAdjustment: 0, notes: null, submitted: false, submittedByRole: null, submittedAt: null };
        },
        { date, manualAdjustment: 0, notes: null, submitted: false, submittedByRole: null, submittedAt: null }
      );
    },
    upsert: async (date, updates) => {
      return runWithFallback(
        async (currentPrisma) => {
          const data = {};
          if (updates.manualAdjustment !== undefined) data.manualAdjustment = Number(updates.manualAdjustment) || 0;
          if (updates.notes !== undefined) data.notes = updates.notes;
          if (updates.submitted !== undefined) {
            data.submitted = Boolean(updates.submitted);
            data.submittedByRole = updates.submitted ? (updates.submittedByRole || null) : null;
            data.submittedAt = updates.submitted ? new Date() : null;
          }

          return currentPrisma.dailySummary.upsert({
            where: { date },
            update: data,
            create: { date, manualAdjustment: 0, ...data },
          });
        },
        { date, manualAdjustment: Number(updates.manualAdjustment) || 0, notes: updates.notes ?? null, submitted: Boolean(updates.submitted), submittedByRole: updates.submittedByRole || null, submittedAt: updates.submitted ? new Date() : null }
      );
    },
  },

  // Receipts grouped by calendar date. `tzOffsetMinutes` is the browser's
  // own offset (JS `Date.getTimezoneOffset()`, minutes WEST of UTC) so a
  // receipt created at, say, 00:20 WAT (Lagos, UTC+1) is correctly counted
  // under that local day instead of the previous UTC day.
  receiptsByDate: {
    get: async (date, tzOffsetMinutes = 0) => {
      return runWithFallback(
        async (currentPrisma) => {
          const all = await currentPrisma.eReceipt.findMany({ orderBy: { createdAt: 'desc' } });
          const matching = all.filter((row) => {
            const localTime = new Date(row.createdAt.getTime() - tzOffsetMinutes * 60000);
            return localTime.toISOString().slice(0, 10) === date;
          });
          return matching.map((row) => ({ ...row, items: row.items ? JSON.parse(row.items) : [] }));
        },
        []
      );
    },
  },
};
