import { storage } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const products = await storage.products.getAll();
    return Response.json({
      success: true,
      data: products,
    });
  } catch (error) {
    return Response.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Owners can create products with full pricing. Sales reps can also add
    // a new item to stock (per the app's design — reps record stock and
    // sales). Cost price (buyPrice) is zeroed out for non-owners since a
    // rep generally doesn't know supplier cost — that's the owner's job to
    // fill in. sellPrice is left as sent: Stock Control's own UI already
    // hides that field from reps (so it arrives as 0 anyway), but
    // E-Receipt's auto-add-to-stock flow sends the *actual, already-
    // transacted* sale price when a rep sells something not yet in stock —
    // zeroing that out here would silently discard a real sale record.
    const productData = await request.json();
    if (user.role !== 'owner') {
      productData.buyPrice = '$0';
    }

    const product = await storage.products.create(productData);

    return Response.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return Response.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
