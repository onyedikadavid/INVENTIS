import { storage } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';
import { CURRENCIES } from '@/lib/currency';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await storage.settings.get();
    return Response.json({ success: true, data: settings });
  } catch (error) {
    console.error('Settings fetch failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'owner') {
      return Response.json({ error: 'Only the owner can change business settings' }, { status: 403 });
    }

    const { currency } = await request.json();
    if (!currency || !CURRENCIES[currency]) {
      return Response.json({ error: 'Unsupported currency' }, { status: 400 });
    }

    const settings = await storage.settings.update(currency);
    return Response.json({ success: true, data: settings });
  } catch (error) {
    console.error('Settings update failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
