import { storage } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';
import { parseCurrency, formatMoney } from '@/lib/currency';

// A sale is recorded exactly once — at the moment a receipt is generated
// (see /api/receipts and /api/whatsapp/send-receipt's caller in the
// e-receipt page, which also deducts inventory right then). This endpoint
// never deducts stock and never creates a sale; it only ever reads
// receipts back out for the given date and layers a manual adjustment +
// notes on top, so "today's sales" can't ever be double-counted.
const getDaySummary = async (date, currency, tzOffsetMinutes) => {
  const [receipts, summary, expenses] = await Promise.all([
    storage.receiptsByDate.get(date, tzOffsetMinutes),
    storage.dailySummary.get(date),
    storage.expenses.getAll(),
  ]);

  const transactionsTotal = receipts.reduce((sum, r) => sum + parseCurrency(r.totalAmount), 0);
  const manualAdjustment = Number(summary.manualAdjustment) || 0;
  const totalSales = transactionsTotal + manualAdjustment;

  const dayExpenses = expenses.filter((e) => e.date === date);
  const expensesTotal = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return {
    date,
    transactions: receipts.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      itemCount: Array.isArray(r.items) ? r.items.length : 0,
      totalAmount: r.totalAmount,
      createdAt: r.createdAt,
    })),
    transactionsTotal,
    transactionsTotalFormatted: formatMoney(transactionsTotal, currency),
    manualAdjustment,
    manualAdjustmentFormatted: formatMoney(manualAdjustment, currency),
    totalSales,
    totalSalesFormatted: formatMoney(totalSales, currency),
    expenses: dayExpenses,
    expensesTotal,
    expensesTotalFormatted: formatMoney(expensesTotal, currency),
    netFormatted: formatMoney(totalSales - expensesTotal, currency),
    notes: summary.notes || '',
    submitted: Boolean(summary.submitted),
    submittedByRole: summary.submittedByRole || null,
    submittedAt: summary.submittedAt || null,
  };
};

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tzOffsetMinutes = Number(searchParams.get('tzOffsetMinutes')) || 0;
    const date = searchParams.get('date') || new Date(Date.now() - tzOffsetMinutes * 60000).toISOString().slice(0, 10);

    const settings = await storage.settings.get();
    const data = await getDaySummary(date, settings?.currency, tzOffsetMinutes);

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Daily summary fetch failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, manualAdjustment, notes, submitted } = await request.json();
    if (!date) {
      return Response.json({ error: 'Date is required' }, { status: 400 });
    }

    const updates = {};
    if (manualAdjustment !== undefined) updates.manualAdjustment = Number(manualAdjustment) || 0;
    if (notes !== undefined) updates.notes = notes;
    if (submitted !== undefined) {
      updates.submitted = Boolean(submitted);
      updates.submittedByRole = user.role;
    }

    await storage.dailySummary.upsert(date, updates);

    const settings = await storage.settings.get();
    const data = await getDaySummary(date, settings?.currency);

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Daily summary update failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
