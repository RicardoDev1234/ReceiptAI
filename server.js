'use strict';
require('dotenv').config();

const express   = require('express');
const path      = require('path');
const fs        = require('fs');
const Stripe    = require('stripe');
const Anthropic = require('@anthropic-ai/sdk');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in .env');
  return new Stripe(key);
}

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set in .env');
  return new Anthropic({ apiKey: key });
}

/* ── Serve index.html with injected public config ── */
app.get('/', (req, res) => {
  const html      = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const injection = `<script>
window.SUPABASE_URL          = ${JSON.stringify(process.env.SUPABASE_URL           || '')};
window.SUPABASE_ANON_KEY     = ${JSON.stringify(process.env.SUPABASE_ANON_KEY      || '')};
window.STRIPE_PUBLISHABLE_KEY= ${JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY || '')};
</script>`;
  res.send(html.replace('</head>', injection + '\n</head>'));
});

/* ── POST /api/create-checkout-session ── */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { plan, email } = req.body;
    const priceId = plan === 'yearly'
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return res.status(500).json({ error: 'Stripe price ID not configured. Set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY in .env' });
    }

    const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    const session = await getStripe().checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      customer_email:       email || undefined,
      line_items:           [{ price: priceId, quantity: 1 }],
      subscription_data:    { trial_period_days: 7 },
      success_url:          `${baseUrl}/?checkout=success`,
      cancel_url:           `${baseUrl}/`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/analyze-receipt ── */
app.post('/api/analyze-receipt', async (req, res) => {
  try {
    const { base64, mediaType } = req.body;
    if (!base64 || !mediaType) {
      return res.status(400).json({ error: 'Missing base64 or mediaType in request body.' });
    }

    const msg = await getAnthropic().messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role:    'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Extract the following from this receipt and respond ONLY with valid JSON, no other text:
{
  "vendor": "store or restaurant name",
  "date": "YYYY-MM-DD",
  "amount": "total with currency symbol",
  "tax": "tax amount with currency symbol or empty string",
  "category": "one of: Food & Drink, Travel, Office Supplies, Software & Subscriptions, Marketing, Utilities, Other",
  "payment": "payment method if visible or empty string"
}`,
          },
        ],
      }],
    });

    const text   = msg.content.map(b => b.text || '').join('');
    const clean  = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error('[Anthropic]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`\n  ReceiptAI web server running → http://localhost:${PORT}\n`)
);
