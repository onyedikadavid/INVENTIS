import { storage } from '@/lib/storage';
import { hashPassword, generateToken, normalizeRole } from '@/lib/auth';
import { CURRENCIES } from '@/lib/currency';

export async function POST(request) {
  try {
    const { name, email, password, role, currency } = await request.json();
    const normalizedRole = normalizeRole(role);

    // Validation
    if (!name || !email || !password || !normalizedRole) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // normalizeRole() already returns null for anything that isn't a
    // recognized owner/sales-rep value, and that's caught by the
    // `!normalizedRole` check above — so no further check is needed here.
    // (The previous check compared against the literal string 'sales',
    // which normalizeRole never returns — it returns 'sales_rep' — so every
    // sales rep sign-up was being rejected with "Invalid role".)

    // Check if user exists
    const existingUser = await storage.users.getByEmail(email);
    if (existingUser) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await storage.users.create({
      name,
      email,
      passwordHash,
      role: normalizedRole,
    });

    // Generate token
    const token = generateToken(user.id, normalizedRole);

    // Business setup: the Owner picks the currency the whole app will use.
    // Only meaningful for owner sign-up (there's one business/currency per
    // deployment) — a chosen, supported currency wins over the default.
    if (normalizedRole === 'owner' && currency && CURRENCIES[currency]) {
      await storage.settings.update(currency);
    }

    // Return user data (without password)
    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
      },
    });
  } catch (error) {
    console.error('Signup route failed:', error);
    return Response.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
