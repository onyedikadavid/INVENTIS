import { storage } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';

// Legacy/historical read-only endpoint. Sales are no longer recorded here —
// see /api/reports/daily, which computes a day's sales live from receipts
// instead of storing a second, separately-deducting copy of the sale.
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
