import { storage } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    // Setting the actual unit prices is the owner's call — enforced here
    // too, not just hidden in the UI. `profit` is left alone even for a
    // sales rep's request: it's a derived figure that legitimately changes
    // whenever a sale or restock moves stockSold/inStock (actions sales
    // reps are allowed to perform), not a price being set directly.
    if (user.role !== 'owner') {
      delete updates.buyPrice;
      delete updates.sellPrice;
    }

    const updated = await storage.products.update(id, updates);

    if (!updated) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Product update failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'owner') {
      return Response.json({ error: 'Only owners can delete products' }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await storage.products.delete(id);

    if (!deleted) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Product delete failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
