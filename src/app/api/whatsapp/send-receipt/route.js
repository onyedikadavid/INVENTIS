import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { getCurrencySymbol } from '@/lib/currency';

// Turns a receipt's items into a plain-text message.
const buildReceiptMessage = ({ customerName, items, total, symbol }) => {
  const lines = (items || []).map(
    (item) => `- ${item.qty} x ${item.description} @ ${symbol}${item.unitAmount} = ${symbol}${item.total}`
  );

  return [
    `Hi ${customerName || 'there'}, here's your receipt:`,
    '',
    ...lines,
    '',
    `Total: ${symbol}${total}`,
    '',
    'Thank you for your purchase!',
  ].join('\n');
};

// wa.me only accepts digits (country code + number, no +, spaces or dashes).
const toWhatsAppDigits = (phoneNumber) => String(phoneNumber || '').replace(/\D/g, '');

// Real, automatic delivery via Twilio's WhatsApp API — only runs if the
// owner has actually signed up for Twilio and added these three env vars.
// Twilio's WhatsApp sandbox/production both use this same REST endpoint,
// so no extra SDK/package install is needed (that also means it works even
// without npm access — it's a plain fetch to Twilio's API).
const trySendViaTwilio = async (toDigits, message) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    return { attempted: false };
  }

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const body = new URLSearchParams({
      To: `whatsapp:+${toDigits}`,
      From: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return { attempted: true, sent: false, error: errorBody?.message || `Twilio error (${response.status})` };
    }

    return { attempted: true, sent: true };
  } catch (error) {
    return { attempted: true, sent: false, error: error.message };
  }
};

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber, customerName, items, total } = await request.json();

    if (!phoneNumber || !items || items.length === 0) {
      return Response.json({ error: 'Invalid receipt data' }, { status: 400 });
    }

    const digits = toWhatsAppDigits(phoneNumber);
    if (!digits) {
      return Response.json({ error: 'Invalid WhatsApp number' }, { status: 400 });
    }

    const settings = await storage.settings.get();
    const symbol = getCurrencySymbol(settings?.currency);

    const message = buildReceiptMessage({ customerName, items, total, symbol });
    const whatsappLink = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

    const twilioResult = await trySendViaTwilio(digits, message);

    if (twilioResult.attempted && twilioResult.sent) {
      // Actually delivered automatically — no further action needed.
      return Response.json({ success: true, sent: true, method: 'twilio' });
    }

    // No WhatsApp Business API is configured (or it failed) — hand back a
    // wa.me link the browser can open, pre-filled with the receipt, so the
    // person generating the receipt just taps "send" in their own WhatsApp.
    // This is the path that works with zero setup.
    return Response.json({
      success: true,
      sent: false,
      method: 'link',
      whatsappLink,
      note: twilioResult.attempted
        ? `Automatic send failed (${twilioResult.error}); use the WhatsApp link instead.`
        : 'No WhatsApp Business API configured — opening a pre-filled WhatsApp chat instead.',
    });
  } catch (error) {
    console.error('WhatsApp receipt send failed:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
