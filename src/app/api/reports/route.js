import { storage, findProductByName, getStockStatus, computeProfitLabel } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await storage.dailyReports.getAll();
    return Response.json({ success: true, data: reports });
  } catch (error) {
    console.error('Reports list failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// Records a day's itemized sales (Owner and Sales Rep both submit these).
// Each line item is matched to an existing stock product, deducted from
// inventory right away, and saved as its own DailyReport row for that date
// — this is what makes "Total Daily Sales" traceable back to real stock
// movement instead of being just a number nobody can reconcile.
export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, items } = await request.json();

    if (!date || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'A date and at least one sold item are required' }, { status: 400 });
    }

    const settings = await storage.settings.get();
    const currency = settings?.currency;

    let allProducts = await storage.products.getAll();
    const createdReports = [];
    const skipped = [];

    for (const item of items) {
      const qty = Number(item.qty) || 0;
      if (!item.productId && !item.productName) {
        skipped.push({ item, reason: 'No product specified' });
        continue;
      }
      if (qty <= 0) {
        skipped.push({ item, reason: 'Quantity must be greater than zero' });
        continue;
      }

      const product = item.productId
        ? allProducts.find((p) => p.id === item.productId)
        : findProductByName(allProducts, item.productName);

      if (!product) {
        skipped.push({ item, reason: 'Product not found in stock list' });
        continue;
      }

      const sellPriceRaw = item.sellPrice !== undefined && item.sellPrice !== null && item.sellPrice !== ''
        ? item.sellPrice
        : product.sellPrice;

      const newInStock = Math.max(0, (Number(product.inStock) || 0) - qty);
      const newCumulativeSold = (Number(product.stockSold) || 0) + qty;

      const updatedProduct = await storage.products.update(product.id, {
        inStock: newInStock,
        stockSold: newCumulativeSold,
        status: getStockStatus(newInStock),
        profit: computeProfitLabel(product.buyPrice, product.sellPrice, newCumulativeSold, currency),
      });
      allProducts = allProducts.map((p) => (p.id === product.id ? updatedProduct : p));

      const report = await storage.dailyReports.create({
        date,
        product: product.name,
        category: product.category,
        buy: product.buyPrice,
        sell: typeof sellPriceRaw === 'string' ? sellPriceRaw : String(sellPriceRaw),
        inStock: newInStock,
        stockSold: qty, // units sold on THIS day, not the product's lifetime total
        profit: computeProfitLabel(product.buyPrice, sellPriceRaw, qty, currency),
        status: getStockStatus(newInStock),
        addedByRole: user.role,
      });
      createdReports.push(report);
    }

    if (createdReports.length === 0) {
      return Response.json({ error: 'No items could be recorded', skipped }, { status: 400 });
    }

    return Response.json({ success: true, data: createdReports, skipped });
  } catch (error) {
    console.error('Daily sale record failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
